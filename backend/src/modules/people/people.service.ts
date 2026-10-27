import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '../../libs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonPfpDto } from './dto/update-person-pfp.dto';
import { ImagesService } from '@modules/images/images.service';

@Injectable()
export class PeopleService {
  constructor(private images: ImagesService) {}

  findAll() {
    return prisma.people.findMany();
  }

  findByTableId(tableId: string) {
    return prisma.people.findMany({
      where: { tableId },
      include: { personalNotes: true },
      orderBy: { name: 'asc' },
    });
  }

  private async assertCapacity(tableId: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { _count: { select: { people: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');
    if (table._count.people >= table.capacity) {
      throw new BadRequestException('Table is full');
    }
    return table;
  }

  private async assertNameFree(
    tableId: string,
    names: string[],
    exceptIds: string[] = [],
  ) {
    const taken = await prisma.people.findFirst({
      where: {
        tableId,
        id: { notIn: exceptIds },
        OR: names.map((name) => ({
          name: { equals: name.trim(), mode: 'insensitive' as const },
        })),
      },
      select: { id: true },
    });
    const lowered = names.map((n) => n.trim().toLowerCase());
    if (taken || new Set(lowered).size !== lowered.length) {
      throw new ConflictException('Someone at this table already has that name');
    }
  }

  async create(dto: CreatePersonDto) {
    const table = await this.assertCapacity(dto.tableId);
    const name = dto.name.trim();
    await this.assertNameFree(table.id, [name]);
    return prisma.people.create({
      data: {
        id: uuidv4(),
        name,
        tableId: table.id,
        eventId: table.eventId,
      },
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    const person = await prisma.people.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Person not found');
    if (dto.name !== undefined && person.tableId) {
      await this.assertNameFree(person.tableId, [dto.name], [id]);
    }
    return prisma.people.update({
      where: { id },
      data: dto.name === undefined ? dto : { ...dto, name: dto.name.trim() },
    });
  }

  async updatePfp(id: string, dto: UpdatePersonPfpDto) {
    const person = await prisma.people.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Person not found');

    const pfpUrl = dto.pfpUrl ?? null;
    if (pfpUrl !== person.pfpUrl) {
      if (person.pfpUrl) await this.images.deleteKey(person.pfpUrl);
      return prisma.people.update({ where: { id }, data: { pfpUrl } });
    }
    return person;
  }

  async remove(id: string) {
    const person = await prisma.people.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Person not found');
    await prisma.people.delete({ where: { id } });
    return { id };
  }

  async bulkRemove(ids: string[]) {
    await prisma.people.deleteMany({ where: { id: { in: ids } } });
    return { removed: ids.length };
  }

  async move(ids: string[], tableId: string) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { _count: { select: { people: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');
    if (table._count.people + ids.length > table.capacity) {
      throw new BadRequestException('Not enough room at the target table');
    }
    const moving = await prisma.people.findMany({
      where: { id: { in: ids } },
      select: { name: true },
    });
    await this.assertNameFree(
      tableId,
      moving.map((p) => p.name),
      ids,
    );
    await prisma.people.updateMany({
      where: { id: { in: ids } },
      data: { tableId, eventId: table.eventId },
    });
    return { moved: ids.length };
  }
}
