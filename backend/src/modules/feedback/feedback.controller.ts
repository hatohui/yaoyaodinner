import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReactDto } from './dto/react.dto';
import {
  GetFeedbackResponseDto,
  FeedbackItemDto,
  FeedbackReactionDto,
} from './dto/feedback-response.dto';
import { AdminGuard } from '@common/guards/admin.guard';
import { FeatureGuard, RequireFeature } from '@common/guards/feature.guard';
import { RateLimit, RateLimitGuard } from '@common/guards/rate-limit.guard';
import { CONFIG_KEYS } from '@common/config/registry';
import { TableAccessService } from '@modules/table-access/table-access.service';
import { TableAuditService } from '@modules/table/table-audit.service';

type FeedbackSort = 'recent' | 'top';

@ApiTags('feedback')
@Controller('feedback')
@UseGuards(FeatureGuard, RateLimitGuard)
@RequireFeature(CONFIG_KEYS.featureFeedbackWall)
export class FeedbackController {
  constructor(
    private feedback: FeedbackService,
    private access: TableAccessService,
    private audit: TableAuditService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getFeedback' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'top'] })
  @ApiResponse({ status: 200, type: GetFeedbackResponseDto })
  findAll(
    @Query('page') page = '1',
    @Query('count') count = '20',
    @Query('sort') sort: FeedbackSort = 'recent',
  ) {
    return this.feedback.findForActiveEvent(
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(count, 10) || 20)),
      sort === 'top' ? 'top' : 'recent',
    );
  }

  @Get('event')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'getFeedbackByEvent' })
  @ApiQuery({ name: 'eventId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'top'] })
  @ApiResponse({ status: 200, type: GetFeedbackResponseDto })
  findByEvent(
    @Query('eventId') eventId: string,
    @Query('page') page = '1',
    @Query('count') count = '20',
    @Query('sort') sort: FeedbackSort = 'recent',
  ) {
    return this.feedback.findByEvent(
      eventId,
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(count, 10) || 20)),
      sort === 'top' ? 'top' : 'recent',
    );
  }

  @Post()
  @RateLimit(15, 60)
  @ApiOperation({ operationId: 'createFeedback' })
  @ApiResponse({ status: 201, type: FeedbackItemDto })
  async create(
    @Body() dto: CreateFeedbackDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forEventPin(headers);
    const created = await this.feedback.create(dto);
    const caller = await this.access.resolveActor(headers);
    await this.audit.logForActor(caller, 'feedback_added', {
      targetName: created.by ?? undefined,
    });
    return created;
  }

  @Post(':id/react')
  @RateLimit(120, 60)
  @ApiOperation({ operationId: 'reactToFeedback' })
  @ApiResponse({ status: 201, type: FeedbackReactionDto })
  async react(
    @Param('id') id: string,
    @Body() dto: ReactDto,
    @Headers() headers: Record<string, string>,
  ) {
    await this.access.forEventPin(headers);
    return this.feedback.react(id, dto.emoji, dto.count);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'deleteFeedback' })
  async remove(@Param('id') id: string) {
    const removed = await this.feedback.remove(id);
    await this.audit.log({
      action: 'feedback_removed',
      actor: 'admin',
      details: { targetName: id },
    });
    return removed;
  }
}
