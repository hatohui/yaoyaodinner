import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  async create(dto: CreatePersonDto) {
    const table = await this.assertCapacity(dto.tableId);
    return prisma.people.create({
      data: {
        id: uuidv4(),
        name: dto.name,
        tableId: table.id,
        eventId: table.eventId,
      },
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    const person = await prisma.people.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Person not found');
    return prisma.people.update({ where: { id }, data: dto });
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
    await prisma.people.updateMany({
      where: { id: { in: ids } },
      data: { tableId, eventId: table.eventId },
    });
    return { moved: ids.length };
  }
}
