import { Injectable, BadRequestException } from '@nestjs/common';
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
      return { feedback, total };
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: { reactions: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * count,
      take: count,
    });
    return {
      feedback: feedback.map((f) => ({
        ...f,
        reactionTotal: f.reactions.reduce((s, r) => s + r.count, 0),
      })),
      total,
    };
  }

  async create(dto: CreateFeedbackDto) {
    const eventId = await this.events.getActiveId();
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
}
