import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { OrderRound } from "@prisma/client";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { generatePin } from "@common/pin";
import { CONFIG_KEYS } from "@common/config/registry";
import { EventService } from "@modules/event/event.service";
import { ConfigService } from "@modules/config/config.service";
import { ImagesService } from "@modules/images/images.service";
import { TableSlotService } from "./table-slot.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { BulkCreateTableDto } from "./dto/bulk-create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import { UpdateTableDetailsDto } from "./dto/update-table-details.dto";

const withSlot = {
  slot: true,
  _count: { select: { people: true } },
} as const;

type TableRow = {
  id: string;
  no: number;
  capacity: number;
  isStaging: boolean;
  tableLeaderId: string | null;
  eventId: string | null;
  slotId: string | null;
  bannerUrl: string | null;
  slot: {
    id: string;
    no: number;
    name: string;
    x: number | null;
    y: number | null;
  } | null;
  _count: { people: number };
};

@Injectable()
export class TableService {
  constructor(
    private events: EventService,
    private slots: TableSlotService,
    private images: ImagesService,
    private config: ConfigService,
  ) {}

  private async newCode() {
    return generatePin(await this.config.get<number>(CONFIG_KEYS.pinLength));
  }

  /** Flattens the slot onto the table so callers see one table-shaped object. */
  private toDto(
    t: TableRow,
    leaderNames?: Map<string, string>,
    matched?: Map<string, string[]>,
  ) {
    return {
      id: t.id,
      slotId: t.slotId,
      no: t.no,
      name: t.slot?.name ?? "",
      x: t.slot?.x ?? null,
      y: t.slot?.y ?? null,
      capacity: t.capacity,
      seated: t._count.people,
      isStaging: t.isStaging,
      eventId: t.eventId,
      bannerUrl: t.bannerUrl,
      tableLeaderId: t.tableLeaderId,
      tableLeaderName: t.tableLeaderId
        ? (leaderNames?.get(t.tableLeaderId) ?? null)
        : null,
      matchedPeople: matched?.get(t.id) ?? [],
    };
  }

  /** Names that caused each table to match, so the UI can show why it is a hit. */
  private async matchedPeople(
    rows: TableRow[],
    search?: string,
  ): Promise<Map<string, string[]>> {
    if (!search || rows.length === 0) return new Map();

    const people = await prisma.people.findMany({
      where: {
        tableId: { in: rows.map((r) => r.id) },
        name: { contains: search, mode: "insensitive" },
      },
      select: { tableId: true, name: true },
    });

    const map = new Map<string, string[]>();
    for (const p of people) {
      if (!p.tableId) continue;
      map.set(p.tableId, [...(map.get(p.tableId) ?? []), p.name]);
    }
    return map;
  }

  /** Everyone at each table by name, for the at-a-glance roster view. */
  private async seatedNames(rows: TableRow[]): Promise<Map<string, string[]>> {
    if (rows.length === 0) return new Map();

    const people = await prisma.people.findMany({
      where: { tableId: { in: rows.map((r) => r.id) } },
      orderBy: { name: "asc" },
      select: { tableId: true, name: true },
    });

    const map = new Map<string, string[]>();
    for (const p of people) {
      if (!p.tableId) continue;
      map.set(p.tableId, [...(map.get(p.tableId) ?? []), p.name]);
    }
    return map;
  }

  /**
   * The running bill per table, matching the splits view: the set menu for
   * everyone seated plus every order that goes on the bill.
   */
  private async orderTotals(rows: TableRow[]) {
    const [orders, preset] = await Promise.all([
      prisma.order.findMany({
        where: {
          tableId: { in: rows.map((r) => r.id) },
          variant: { food: { shouldCalculate: true } },
        },
        select: {
          tableId: true,
          price: true,
          quantity: true,
          variant: { select: { currency: true } },
        },
      }),
      prisma.presetMenu.findFirst({
        where: { isActive: true },
        select: {
          price: true,
          foods: { take: 1, select: { variant: { select: { currency: true } } } },
        },
      }),
    ]);

    const setPrice = preset ? Number(preset.price) : 0;
    const totals = new Map<string, { orderTotal: number; currency: string | null }>();
    for (const r of rows) {
      if (setPrice > 0 && r._count.people > 0) {
        totals.set(r.id, {
          orderTotal: setPrice * r._count.people,
          currency: preset?.foods[0]?.variant.currency ?? null,
        });
      }
    }
    for (const o of orders) {
      const prev = totals.get(o.tableId);
      totals.set(o.tableId, {
        orderTotal: (prev?.orderTotal ?? 0) + Number(o.price) * o.quantity,
        currency: prev?.currency ?? o.variant.currency,
      });
    }
    return totals;
  }

  /** One lookup for the whole page rather than a join per row. */
  private async leaderNames(rows: TableRow[]): Promise<Map<string, string>> {
    const ids = rows
      .map((r) => r.tableLeaderId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return new Map();

    const people = await prisma.people.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(people.map((p) => [p.id, p.name]));
  }

  async findForEvent(
    page = 1,
    count = 20,
    search?: string,
    forEventId?: string,
  ) {
    const eventId = await this.events.resolveEventId(forEventId);
    if (!eventId) return { tables: [], total: 0 };

    // Guests look for "where am I sitting" as often as for a table number, so a
    // search hits the slot number, slot name or anyone seated at it.
    const searchNo =
      search && /^\d+$/.test(search.trim()) ? Number(search) : null;
    const where = {
      eventId,
      isStaging: false,
      ...(search
        ? {
            OR: [
              ...(searchNo !== null ? [{ no: searchNo }] : []),
              {
                slot: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
              {
                people: {
                  some: {
                    name: { contains: search, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.table.findMany({
        where,
        orderBy: { no: "asc" },
        skip: (page - 1) * count,
        take: count,
        include: withSlot,
      }),
      prisma.table.count({ where }),
    ]);

    const [names, matched, totals, seated] = await Promise.all([
      this.leaderNames(rows),
      this.matchedPeople(rows, search),
      this.orderTotals(rows),
      this.seatedNames(rows),
    ]);
    return {
      tables: rows.map((r) => ({
        ...this.toDto(r, names, matched),
        seatedNames: seated.get(r.id) ?? [],
        orderTotal: totals.get(r.id)?.orderTotal ?? 0,
        currency: totals.get(r.id)?.currency ?? null,
      })),
      total,
    };
  }

  /** Who sits where and what they ordered, for printing; prices are left out. */
  async exportForEvent(forEventId?: string, lang = "en", includeDinner = false) {
    const eventId = await this.events.resolveEventId(forEventId);
    if (!eventId) return [];

    const rows = await prisma.table.findMany({
      where: { eventId, isStaging: false },
      orderBy: { no: "asc" },
      include: {
        slot: { select: { name: true } },
        people: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        // the export is mainly the pre-order list sent to the restaurant
        orders: {
          where: includeDinner ? undefined : { round: "pre" },
          orderBy: { createdAt: "asc" },
          select: {
            quantity: true,
            round: true,
            variant: {
              select: {
                id: true,
                translations: {
                  where: { language: lang },
                  select: { label: true },
                },
                food: {
                  select: {
                    translations: {
                      where: { language: lang },
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((r) => {
      const foods = new Map<
        string,
        {
          variantId: string;
          round: OrderRound;
          foodName: string;
          variantLabel: string;
          quantity: number;
        }
      >();
      for (const o of r.orders) {
        const key = `${o.round}|${o.variant.id}`;
        const prev = foods.get(key);
        foods.set(key, {
          variantId: o.variant.id,
          round: o.round,
          foodName: o.variant.food.translations[0]?.name ?? "",
          variantLabel: o.variant.translations[0]?.label ?? "",
          quantity: (prev?.quantity ?? 0) + o.quantity,
        });
      }

      return {
        id: r.id,
        no: r.no,
        name: r.slot?.name ?? "",
        hostName:
          r.people.find((p) => p.id === r.tableLeaderId)?.name ?? null,
        people: r.people.map((p) => p.name),
        foods: [...foods.values()],
      };
    });
  }

  async findStaged() {
    const rows = await prisma.table.findMany({
      where: { isStaging: true },
      orderBy: { no: "asc" },
      include: withSlot,
    });
    const names = await this.leaderNames(rows);
    return rows.map((r) => this.toDto(r, names));
  }

  async findOne(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: withSlot,
    });
    if (!table) throw new NotFoundException("Table not found");
    return this.toDto(table, await this.leaderNames([table]));
  }

  /** Staged tables count among themselves, so a published set starts at 1. */
  private async nextNo(isStaging: boolean, eventId: string | null) {
    const max = await prisma.table.aggregate({
      where: isStaging ? { isStaging: true } : { eventId, isStaging: false },
      _max: { no: true },
    });
    return (max._max.no ?? 0) + 1;
  }

  async create(dto: CreateTableDto) {
    const isStaging = dto.isStaging ?? false;
    const eventId = isStaging ? null : await this.events.getActiveId();

    const slot = dto.slotId
      ? await this.slots.findOne(dto.slotId)
      : await this.slots.create({
          name: dto.name,
          defaultCapacity: dto.capacity,
        });

    const table = await prisma.table.create({
      data: {
        id: uuidv4(),
        slotId: slot.id,
        no: await this.nextNo(isStaging, eventId),
        capacity: dto.capacity ?? slot.defaultCapacity,
        isStaging,
        eventId,
        code: await this.newCode(),
      },
      include: withSlot,
    });
    return this.toDto(table);
  }

  /**
   * Reuses existing slots before minting new ones — otherwise every event would
   * invent fresh numbers for the same physical room.
   */
  async bulkCreate(dto: BulkCreateTableDto) {
    const isStaging = dto.isStaging ?? true;
    const eventId = isStaging ? null : await this.events.getActiveId();

    const taken = await prisma.table.findMany({
      where: isStaging ? { isStaging: true } : { eventId },
      select: { slotId: true },
    });
    const takenIds = new Set(taken.map((t) => t.slotId));

    const free = (await this.slots.findAll()).filter(
      (s) => !takenIds.has(s.id),
    );
    const reuse = free.slice(0, dto.count);
    const missing = dto.count - reuse.length;

    if (missing > 0) {
      const reuseIds = new Set(reuse.map((s) => s.id));
      await this.slots.bulkCreate({
        count: missing,
        defaultCapacity: dto.capacity,
      });
      const fresh = (await this.slots.findAll()).filter(
        (s) => !takenIds.has(s.id) && !reuseIds.has(s.id),
      );
      reuse.push(...fresh.slice(0, missing));
    }

    const codeLength = await this.config.get<number>(CONFIG_KEYS.pinLength);
    const startNo = await this.nextNo(isStaging, eventId);
    await prisma.table.createMany({
      data: reuse.map((slot, i) => ({
        id: uuidv4(),
        slotId: slot.id,
        no: startNo + i,
        capacity: dto.capacity ?? slot.defaultCapacity,
        isStaging,
        eventId,
        code: generatePin(codeLength),
      })),
    });

    return {
      created: reuse.length,
      reused: reuse.length - Math.max(0, missing),
    };
  }

  async update(id: string, dto: UpdateTableDto) {
    const table = await this.findOne(id);

    // name belongs to the physical slot, capacity to this event's seating
    if (dto.name !== undefined && table.slotId) {
      await this.slots.update(table.slotId, { name: dto.name });
    }

    if (dto.capacity !== undefined) {
      await prisma.table.update({
        where: { id },
        data: { capacity: dto.capacity },
      });
    }

    return this.findOne(id);
  }

  async updateDetails(id: string, dto: UpdateTableDetailsDto) {
    const table = await this.findOne(id);

    if (dto.tableLeaderId) {
      const person = await prisma.people.findUnique({
        where: { id: dto.tableLeaderId },
        select: { tableId: true },
      });
      if (!person || person.tableId !== id) {
        throw new BadRequestException(
          "That person is not seated at this table",
        );
      }
    }

    if (dto.name !== undefined && table.slotId) {
      await this.slots.update(table.slotId, { name: dto.name });
    }

    if (dto.tableLeaderId !== undefined) {
      await prisma.table.update({
        where: { id },
        data: { tableLeaderId: dto.tableLeaderId },
      });
    }

    if (dto.bannerUrl !== undefined && dto.bannerUrl !== table.bannerUrl) {
      if (table.bannerUrl) await this.images.deleteKey(table.bannerUrl);
      await prisma.table.update({
        where: { id },
        data: { bannerUrl: dto.bannerUrl },
      });
    }

    return this.findOne(id);
  }

  async verifyCode(id: string, code: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      select: { code: true },
    });
    if (!table) throw new NotFoundException("Table not found");
    return { valid: table.code === code };
  }

  async getCode(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      select: { id: true, code: true },
    });
    if (!table) throw new NotFoundException("Table not found");
    return table;
  }

  listCodes() {
    return prisma.table.findMany({ select: { id: true, code: true } });
  }

  async rerollCodes(ids: string[]) {
    const length = await this.config.get<number>(CONFIG_KEYS.pinLength);
    const existing = await prisma.table.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return prisma.$transaction(
      existing.map(({ id }) =>
        prisma.table.update({
          where: { id },
          data: { code: generatePin(length) },
          select: { id: true, code: true },
        }),
      ),
    );
  }

  async rerollCode(id: string) {
    await this.findOne(id);
    return prisma.table.update({
      where: { id },
      data: { code: await this.newCode() },
      select: { id: true, code: true },
    });
  }

  /** Positions live on the slot, so the floor plan survives publishing. */
  async updatePosition(id: string, x: number | null, y: number | null) {
    const table = await this.findOne(id);
    if (!table.slotId) throw new BadRequestException("Table has no slot");
    await this.slots.updatePosition(table.slotId, x, y);
    return this.findOne(id);
  }

  async swapNumbers(aId: string, bId: string) {
    const [a, b] = await Promise.all([
      prisma.table.findUnique({ where: { id: aId } }),
      prisma.table.findUnique({ where: { id: bId } }),
    ]);
    if (!a || !b) throw new NotFoundException("Table not found");
    if (a.id === b.id) {
      throw new BadRequestException("Pick two different tables");
    }
    if (a.isStaging !== b.isStaging || a.eventId !== b.eventId) {
      throw new BadRequestException("Both tables must be in the same event");
    }

    await prisma.$transaction([
      prisma.table.update({ where: { id: a.id }, data: { no: b.no } }),
      prisma.table.update({ where: { id: b.id }, data: { no: a.no } }),
    ]);
    return Promise.all([this.findOne(a.id), this.findOne(b.id)]);
  }

  async remove(id: string) {
    await this.findOne(id);
    await prisma.table.delete({ where: { id } });
    return { id };
  }

  async bulkRemove(ids: string[]) {
    await prisma.table.deleteMany({ where: { id: { in: ids } } });
    return { removed: ids.length };
  }

  async bulkReassign(ids: string[], eventId: string | null) {
    if (eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw new BadRequestException("Target event not found");
    }
    await prisma.table.updateMany({
      where: { id: { in: ids } },
      data: { eventId, isStaging: eventId === null },
    });
    return { reassigned: ids.length };
  }
}
