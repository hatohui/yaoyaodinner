import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AdminGuard } from '@common/guards/admin.guard';
import {
  PopularItemDto,
  TableTotalDto,
  PeopleListDto,
} from './dto/stats-response.dto';

@ApiTags('stats')
@Controller('stats')
@UseGuards(AdminGuard)
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get('popular')
  @ApiOperation({ operationId: 'getPopularItems' })
  @ApiQuery({ name: 'scope', required: false, enum: ['event', 'all'] })
  @ApiQuery({ name: 'lang', required: false, type: String })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'How many items to return, most ordered first; 0 for all. Defaults to 10.',
  })
  @ApiResponse({ status: 200, type: [PopularItemDto] })
  popular(
    @Query('scope') scope: 'event' | 'all' = 'event',
    @Query('lang') lang = 'en',
    @Query('eventId') eventId?: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = Number(limit);
    return this.stats.popular(
      scope === 'all' ? 'all' : 'event',
      lang,
      eventId,
      limit !== undefined && Number.isInteger(parsed) && parsed >= 0 ? parsed : 10,
    );
  }

  @Get('tables')
  @ApiOperation({ operationId: 'getTableTotals' })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiResponse({ status: 200, type: [TableTotalDto] })
  tableTotals(@Query('eventId') eventId?: string) {
    return this.stats.tableTotals(eventId);
  }

  @Get('people')
  @ApiOperation({ operationId: 'getPeopleList' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'lang', required: false, type: String })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiResponse({ status: 200, type: PeopleListDto })
  peopleList(
    @Query('page') page = '1',
    @Query('count') count = '20',
    @Query('search') search?: string,
    @Query('lang') lang = 'en',
    @Query('eventId') eventId?: string,
  ) {
    return this.stats.peopleList(
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(100, Math.max(1, parseInt(count, 10) || 20)),
      search,
      lang,
      eventId,
    );
  }
}
