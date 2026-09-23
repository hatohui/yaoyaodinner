import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '../../libs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { EventService } from '@modules/event/event.service';
import { ImagesService } from '@modules/images/images.service';
import { TableSlotService } from './table-slot.service';
import { CreateTableDto } from './dto/create-table.dto';
import { BulkCreateTableDto } from './dto/bulk-create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableDetailsDto } from './dto/update-table-details.dto';

const withSlot = {
  slot: true,
  _count: { select: { people: true } },
} as const;

type TableRow = {
  id: string;
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
  ) {}

  /** Flattens the slot onto the table so callers see one table-shaped object. */
  private toDto(
    t: TableRow,
    leaderNames?: Map<string, string>,
    matched?: Map<string, string[]>,
  ) {
    return {
      id: t.id,
      slotId: t.slotId,
      no: t.slot?.no ?? -1,
      name: t.slot?.name ?? '',
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
        name: { contains: search, mode: 'insensitive' },
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
    // search hits the slot name or anyone seated at it.
    const where = {
      eventId,
      isStaging: false,
      ...(search
        ? {
            OR: [
              {
                slot: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                people: {
                  some: {
                    name: { contains: search, mode: 'insensitive' as const },
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
        orderBy: { slot: { no: 'asc' } },
        skip: (page - 1) * count,
        take: count,
        include: withSlot,
      }),
      prisma.table.count({ where }),
    ]);

    const [names, matched] = await Promise.all([
      this.leaderNames(rows),
      this.matchedPeople(rows, search),
    ]);
    return {
      tables: rows.map((r) => this.toDto(r, names, matched)),
      total,
    };
  }

  async findStaged() {
    const rows = await prisma.table.findMany({
      where: { isStaging: true },
      orderBy: { slot: { no: 'asc' } },
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
    if (!table) throw new NotFoundException('Table not found');
    return this.toDto(table, await this.leaderNames([table]));
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
        capacity: dto.capacity ?? slot.defaultCapacity,
        isStaging,
        eventId,
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

    await prisma.table.createMany({
      data: reuse.map((slot) => ({
        id: uuidv4(),
        slotId: slot.id,
        capacity: dto.capacity ?? slot.defaultCapacity,
        isStaging,
        eventId,
      })),
    });

    return { created: reuse.length, reused: reuse.length - Math.max(0, missing) };
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
        throw new BadRequestException('That person is not seated at this table');
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

  /** Positions live on the slot, so the floor plan survives publishing. */
  async updatePosition(id: string, x: number, y: number) {
    const table = await this.findOne(id);
    if (!table.slotId) throw new BadRequestException('Table has no slot');
    await this.slots.updatePosition(table.slotId, x, y);
    return this.findOne(id);
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
      if (!event) throw new BadRequestException('Target event not found');
    }
    await prisma.table.updateMany({
      where: { id: { in: ids } },
      data: { eventId, isStaging: eventId === null },
    });
    return { reassigned: ids.length };
  }
}
