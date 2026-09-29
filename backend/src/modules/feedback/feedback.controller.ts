import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
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

type FeedbackSort = 'recent' | 'top';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private feedback: FeedbackService) {}

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
  @ApiOperation({ operationId: 'createFeedback' })
  @ApiResponse({ status: 201, type: FeedbackItemDto })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedback.create(dto);
  }

  @Post(':id/react')
  @ApiOperation({ operationId: 'reactToFeedback' })
  @ApiResponse({ status: 201, type: FeedbackReactionDto })
  react(@Param('id') id: string, @Body() dto: ReactDto) {
    return this.feedback.react(id, dto.emoji, dto.count);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'deleteFeedback' })
  remove(@Param('id') id: string) {
    return this.feedback.remove(id);
  }
}
