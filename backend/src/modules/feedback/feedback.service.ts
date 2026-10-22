import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { prisma } from '../../libs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { EventService } from '@modules/event/event.service';

type FeedbackSort = 'recent' | 'top';

@Injectable()
export class FeedbackService {
  constructor(private events: EventService) {}

  async findForActiveEvent(page = 1, count = 20, sort: FeedbackSort = 'recent') {
    const eventId = await this.events.getActiveId();
    if (!eventId) return { feedback: [], total: 0 };
    return this.paginate(eventId, page, count, sort);
  }

  findByEvent(
    eventId: string,
    page = 1,
    count = 20,
    sort: FeedbackSort = 'recent',
  ) {
    return this.paginate(eventId, page, count, sort);
  }

  private async paginate(
    eventId: string,
    page: number,
    count: number,
    sort: FeedbackSort,
  ) {
    const where = { eventId };
    const total = await prisma.feedback.count({ where });

    if (sort === 'top') {
      const all = await prisma.feedback.findMany({
        where,
        include: { reactions: true },
        orderBy: { createdAt: 'desc' },
      });
      const withTotals = all
        .map((f) => ({
          ...f,
          reactionTotal: f.reactions.reduce((s, r) => s + r.count, 0),
        }))
        .sort((a, b) => b.reactionTotal - a.reactionTotal);
      const feedback = withTotals.slice((page - 1) * count, page * count);
      return { feedback: await this.withAuthors(eventId, feedback), total };
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: { reactions: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * count,
      take: count,
    });
    return {
      feedback: await this.withAuthors(
        eventId,
        feedback.map((f) => ({
          ...f,
          reactionTotal: f.reactions.reduce((s, r) => s + r.count, 0),
        })),
      ),
      total,
    };
  }

  /**
   * Posts only store a typed name, so link it to someone at the event when
   * exactly one person has that name; a shared name stays unlinked.
   */
  private async withAuthors<T extends { by: string | null }>(
    eventId: string,
    items: T[],
  ) {
    const names = [
      ...new Set(
        items.map((f) => f.by?.trim()).filter((n): n is string => Boolean(n)),
      ),
    ];
    if (names.length === 0) return items.map((f) => ({ ...f, author: null }));

    const people = await prisma.people.findMany({
      where: {
        eventId,
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' as const },
        })),
      },
      select: {
        id: true,
        name: true,
        pfpUrl: true,
        personalNotes: { select: { content: true }, take: 1 },
        table: {
          select: { id: true, no: true, slot: { select: { name: true } } },
        },
      },
    });

    const byName = new Map<string, typeof people>();
    for (const p of people) {
      const key = p.name.toLowerCase();
      byName.set(key, [...(byName.get(key) ?? []), p]);
    }

    return items.map((f) => {
      const matches = f.by ? byName.get(f.by.trim().toLowerCase()) : undefined;
      const p = matches?.length === 1 ? matches[0] : null;
      return {
        ...f,
        author: p && {
          personId: p.id,
          name: p.name,
          pfpUrl: p.pfpUrl,
          note: p.personalNotes[0]?.content ?? null,
          tableId: p.table?.id ?? null,
          tableNo: p.table?.no ?? null,
          tableName: p.table?.slot?.name ?? null,
        },
      };
    });
  }

  async create(dto: CreateFeedbackDto) {
    const eventId = await this.events.getActiveId();
    if (!eventId) throw new UnauthorizedException('No active event');
    const feedback = await prisma.feedback.create({
      data: {
        id: uuidv4(),
        by: dto.by || null,
        content: dto.content || null,
        imageUrl: dto.imageUrl || null,
        eventId,
      },
      include: { reactions: true },
    });
    return { ...feedback, reactionTotal: 0 };
  }

  async react(feedbackId: string, emoji: string, count = 1) {
    const value = emoji.trim();
    if (!value || value.length > 16) {
      throw new BadRequestException('Invalid reaction');
    }
    const amount = Math.max(1, count);
    const reaction = await prisma.feedbackReaction.upsert({
      where: { feedbackId_emoji: { feedbackId, emoji: value } },
      update: { count: { increment: amount } },
      create: { feedbackId, emoji: value, count: amount },
    });
    return reaction;
  }

  async remove(id: string) {
    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Feedback not found');
    await prisma.feedback.delete({ where: { id } });
    return { id };
  }
}
