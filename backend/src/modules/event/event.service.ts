import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderingStage as StoredStage } from '@prisma/client';
import { prisma } from '../../libs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { generatePin } from '@common/pin';
import { CacheService } from '@libs/redis';
import { CacheSettings } from '@common/cache/constants';
import { ConfigService } from '@modules/config/config.service';
import { ImagesService } from '@modules/images/images.service';
import { CONFIG_KEYS } from '@common/config/registry';
import {
  DEFAULT_TIMEZONE,
  effectiveStage,
  OrderingStage,
  parseEventTime,
} from '@common/ordering/stage';
import { PublishEventDto } from './dto/publish-event.dto';

type ActiveEventMeta = { id: string; pin: string };

@Injectable()
export class EventService {
  constructor(
    private config: ConfigService,
    private images: ImagesService,
  ) {}

  private verifyOwnerPassphrase(passphrase?: string) {
    const expected = process.env.DESTRUCTIVE_PASSPHRASE ?? 'hatohui@gmail.com';
    if (!passphrase || passphrase.trim() !== expected) {
      throw new ForbiddenException('Invalid owner passphrase');
    }
  }

  getActive() {
    return prisma.event.findFirst({ where: { isActive: true } });
  }

  async getActiveMeta(): Promise<ActiveEventMeta | null> {
    const cached = await CacheService.get<ActiveEventMeta>(
      CacheSettings.event.active.key,
    );
    if (cached) return cached;

    const event = await prisma.event.findFirst({
      where: { isActive: true },
      select: { id: true, pin: true },
    });
    if (!event) return null;

    await CacheService.set(
      CacheSettings.event.active.key,
      event,
      CacheSettings.event.active.ttl,
    );
    return event;
  }

  async getActiveId(): Promise<string | null> {
    return (await this.getActiveMeta())?.id ?? null;
  }

  /**
   * Admin views can pin themselves to a past event; everything else falls back
   * to whatever is live right now.
   */
  async resolveEventId(eventId?: string): Promise<string | null> {
    if (!eventId) return this.getActiveId();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event.id;
  }

  private async orderingTimes() {
    const [timezone, deadline, dinnerTime, autoConfirm, dinnerPriceEditable] =
      await Promise.all([
        this.config.get<string>(CONFIG_KEYS.timezone),
        this.config.get<string>(CONFIG_KEYS.ordersDeadline),
        this.config.get<string>(CONFIG_KEYS.dinnerTime),
        this.config.get<boolean>(CONFIG_KEYS.ordersAutoConfirm),
        this.config.get<boolean>(CONFIG_KEYS.dinnerPriceEditable),
      ]);
    const zone = timezone?.trim() || DEFAULT_TIMEZONE;
    return {
      timezone: zone,
      deadline: parseEventTime(deadline ?? '', zone),
      dinnerTime: parseEventTime(dinnerTime ?? '', zone),
      autoConfirm: autoConfirm !== false,
      dinnerPriceEditable: dinnerPriceEditable !== false,
    };
  }

  /** Tables not yet published into an event can't take guest orders. */
  async stageOf(eventId: string | null): Promise<OrderingStage> {
    if (!eventId) return 'closed';
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { orderingStage: true },
    });
    if (!event) return 'closed';
    return effectiveStage(event.orderingStage, await this.orderingTimes());
  }

  async getOrderingStatus() {
    const [event, times] = await Promise.all([
      prisma.event.findFirst({
        where: { isActive: true },
        select: { orderingStage: true },
      }),
      this.orderingTimes(),
    ]);
    return {
      stage: event ? effectiveStage(event.orderingStage, times) : 'closed',
      timezone: times.timezone,
      deadline: times.deadline?.toISOString() ?? null,
      dinnerTime: times.dinnerTime?.toISOString() ?? null,
      autoConfirm: times.autoConfirm,
      dinnerPriceEditable: times.dinnerPriceEditable,
    };
  }

  /**
   * Finalizing locks totals and writes a new versioned, read-only snapshot to S3.
   * Re-opening a finalized event requires the owner passphrase.
   */
  async setStage(id: string, stage: StoredStage, passphrase?: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.orderingStage === 'finalized' && stage !== 'finalized') {
      this.verifyOwnerPassphrase(passphrase);
    }
    const updated = await prisma.event.update({
      where: { id },
      data: { orderingStage: stage },
    });
    if (stage === 'finalized') {
      await this.backupEventSnapshot(id);
    }
    return updated;
  }

  async findPast() {
    const events = await prisma.event.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(events.map((e) => this.withStats(e)));
  }

  async findOne(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return this.withStats(event);
  }

  async getActiveWithStats() {
    const event = await this.getActive();
    if (!event) return null;
    return this.withStats(event);
  }

  async publish(dto: PublishEventDto) {
    const previousActive = await this.getActive();
    const pinLength = await this.config.get<number>(CONFIG_KEYS.pinLength);
    const event = await prisma.$transaction(async (tx) => {
      await tx.event.updateMany({
        where: { isActive: true },
        data: { isActive: false, orderingStage: 'finalized' },
      });

      const created = await tx.event.create({
        data: {
          id: uuidv4(),
          pin: generatePin(pinLength),
          name: dto.name ?? null,
          isActive: true,
          presetMenuId: dto.presetMenuId ?? null,
        },
      });

      await tx.table.updateMany({
        where: { isStaging: true },
        data: { isStaging: false, eventId: created.id },
      });

      return created;
    });

    await this.invalidateActive();
    if (previousActive && previousActive.orderingStage !== 'finalized') {
      await this.backupEventSnapshot(previousActive.id);
    }
    return event;
  }

  async assignPreset(id: string, presetMenuId: string | null) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return prisma.event.update({
      where: { id },
      data: { presetMenuId },
    });
  }

  async rename(id: string, name: string | null) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await prisma.event.update({
      where: { id },
      data: { name: name?.trim() || null },
    });
    if (updated.isActive) await this.invalidateActive();
    return updated;
  }

  async rerollPin(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const pinLength = await this.config.get<number>(CONFIG_KEYS.pinLength);
    const updated = await prisma.event.update({
      where: { id },
      data: { pin: generatePin(pinLength) },
    });
    if (updated.isActive) await this.invalidateActive();
    return updated;
  }

  async activate(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.event.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
      return tx.event.update({ where: { id }, data: { isActive: true } });
    });

    await this.invalidateActive();
    return updated;
  }

  async remove(id: string, passphrase?: string) {
    this.verifyOwnerPassphrase(passphrase);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    await prisma.event.delete({ where: { id } });
    if (event.isActive) await this.invalidateActive();
  }

  private async backupEventSnapshot(eventId: string) {
    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        presetMenu: {
          include: {
            translations: true,
            foods: {
              include: {
                variant: {
                  include: {
                    translations: true,
                    food: { include: { translations: true } },
                  },
                },
              },
            },
          },
        },
        tables: {
          where: { isStaging: false },
          orderBy: { no: 'asc' },
          include: {
            slot: true,
            people: {
              include: { personalNotes: true },
              orderBy: { name: 'asc' },
            },
            orders: {
              orderBy: { createdAt: 'asc' },
              include: {
                splits: {
                  include: { person: { select: { id: true, name: true } } },
                },
                variant: {
                  include: {
                    translations: true,
                    food: { include: { translations: true } },
                  },
                },
              },
            },
          },
        },
        people: {
          where: { tableId: null },
          include: { personalNotes: true },
        },
        feedbacks: {
          orderBy: { createdAt: 'asc' },
          include: { reactions: true },
        },
      },
    });
    if (!full) return null;

    const tables = full.tables.map((t) => {
      const tableTotal = t.orders.reduce(
        (sum, o) =>
          o.variant.food.shouldCalculate
            ? sum + Number(o.price) * o.quantity
            : sum,
        0,
      );
      return {
        id: t.id,
        no: t.no,
        name: t.slot?.name ?? `Table ${t.no}`,
        slotId: t.slotId,
        x: t.slot?.x ?? null,
        y: t.slot?.y ?? null,
        capacity: t.capacity,
        code: t.code,
        bannerUrl: t.bannerUrl,
        tableLeaderId: t.tableLeaderId,
        total: Number(tableTotal.toFixed(2)),
        people: t.people.map((p) => ({
          id: p.id,
          name: p.name,
          pfpUrl: p.pfpUrl,
          isHost: p.id === t.tableLeaderId,
          notes: p.personalNotes.map((n) => n.content),
        })),
        orders: t.orders.map((o) => ({
          id: o.id,
          variantId: o.variantId,
          foodId: o.variant.foodId,
          foodNames: o.variant.food.translations.reduce<Record<string, string>>(
            (acc, tr) => {
              acc[tr.language] = tr.name;
              return acc;
            },
            {},
          ),
          variantLabels: o.variant.translations.reduce<Record<string, string>>(
            (acc, tr) => {
              acc[tr.language] = tr.label;
              return acc;
            },
            {},
          ),
          quantity: o.quantity,
          price: Number(o.price),
          currency: o.variant.currency,
          shouldCalculate: o.variant.food.shouldCalculate,
          round: o.round,
          splitAll: o.splitAll,
          priceEdited: o.priceEdited,
          createdAt: o.createdAt,
          splits: o.splits.map((s) => ({
            personId: s.personId,
            personName: s.person.name,
          })),
        })),
      };
    });

    const totalSpend = tables.reduce((sum, t) => sum + t.total, 0);
    const totalPeople =
      tables.reduce((sum, t) => sum + t.people.length, 0) + full.people.length;
    const totalOrders = tables.reduce((sum, t) => sum + t.orders.length, 0);

    return this.images.saveEventBackup(eventId, {
      event: {
        id: full.id,
        name: full.name,
        pin: full.pin,
        isActive: full.isActive,
        orderingStage: full.orderingStage,
        presetMenuId: full.presetMenuId,
        createdAt: full.createdAt,
      },
      summary: {
        tablesCount: tables.length,
        peopleCount: totalPeople,
        ordersCount: totalOrders,
        totalSpend: Number(totalSpend.toFixed(2)),
        currency: 'RM',
      },
      presetMenu: full.presetMenu,
      tables,
      unassignedPeople: full.people,
      feedbacks: full.feedbacks,
    });
  }

  private invalidateActive() {
    return CacheService.delete(CacheSettings.event.active.key);
  }

  private async withStats(event: {
    id: string;
    pin: string;
    name: string | null;
    isActive: boolean;
    presetMenuId: string | null;
    orderingStage: StoredStage;
    createdAt: Date;
  }) {
    const [tables, people, orders] = await Promise.all([
      prisma.table.findMany({
        where: { eventId: event.id },
        select: { id: true, _count: { select: { people: true } } },
      }),
      prisma.people.count({ where: { eventId: event.id } }),
      prisma.order.count({ where: { eventId: event.id } }),
    ]);

    return {
      ...event,
      stats: {
        tables: tables.length,
        occupied: tables.filter((t) => t._count.people > 0).length,
        people,
        orders,
      },
    };
  }
}
