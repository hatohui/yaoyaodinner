import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '../../libs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@modules/config/config.service';
import { CONFIG_KEYS } from '@common/config/registry';
import {
  CreateTableSlotDto,
  BulkCreateTableSlotDto,
  UpdateTableSlotDto,
} from './dto/table-slot.dto';

/**
 * Slots are the restaurant's physical layout — created once, positioned once,
 * and reused by every event. Nothing here is event-scoped.
 */
@Injectable()
export class TableSlotService {
  constructor(private config: ConfigService) {}

  findAll(includeInactive = false) {
    return prisma.tableSlot.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { no: 'asc' },
    });
  }

  async findOne(id: string) {
    const slot = await prisma.tableSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Table slot not found');
    return slot;
  }

  private async nextNo(): Promise<number> {
    const max = await prisma.tableSlot.aggregate({ _max: { no: true } });
    return (max._max.no ?? 0) + 1;
  }

  private async defaultCapacity(): Promise<number> {
    return this.config.get<number>(CONFIG_KEYS.defaultTableCapacity);
  }

  async create(dto: CreateTableSlotDto) {
    const no = dto.no ?? (await this.nextNo());

    const clash = await prisma.tableSlot.findUnique({ where: { no } });
    if (clash) throw new ConflictException(`Table number ${no} already exists`);

    return prisma.tableSlot.create({
      data: {
        id: uuidv4(),
        no,
        name: dto.name?.trim() || `Table ${no}`,
        defaultCapacity: dto.defaultCapacity ?? (await this.defaultCapacity()),
      },
    });
  }

  async bulkCreate(dto: BulkCreateTableSlotDto) {
    const start = await this.nextNo();
    const capacity = dto.defaultCapacity ?? (await this.defaultCapacity());

    const data = Array.from({ length: dto.count }, (_, i) => ({
      id: uuidv4(),
      no: start + i,
      name: `Table ${start + i}`,
      defaultCapacity: capacity,
    }));

    await prisma.tableSlot.createMany({ data });
    return { created: data.length, from: start, to: start + dto.count - 1 };
  }

  async update(id: string, dto: UpdateTableSlotDto) {
    await this.findOne(id);

    if (dto.no !== undefined) {
      const clash = await prisma.tableSlot.findUnique({ where: { no: dto.no } });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Table number ${dto.no} already exists`);
      }
    }

    return prisma.tableSlot.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.no !== undefined ? { no: dto.no } : {}),
        ...(dto.defaultCapacity !== undefined
          ? { defaultCapacity: dto.defaultCapacity }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async updatePosition(id: string, x: number | null, y: number | null) {
    await this.findOne(id);
    return prisma.tableSlot.update({ where: { id }, data: { x, y } });
  }

  /**
   * Deleting a slot would orphan every past event's seating, so a slot that has
   * ever been used is retired instead.
   */
  async remove(id: string) {
    await this.findOne(id);

    const used = await prisma.table.count({ where: { slotId: id } });
    if (used > 0) {
      await prisma.tableSlot.update({
        where: { id },
        data: { isActive: false },
      });
      return { id, retired: true };
    }

    await prisma.tableSlot.delete({ where: { id } });
    return { id, retired: false };
  }
}
