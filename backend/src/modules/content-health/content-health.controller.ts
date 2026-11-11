import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@common/guards/admin.guard';
import { ContentHealthService } from './content-health.service';
import {
  AiBatchProgressDto,
  AiJobStatusDto,
  AiJobsDto,
  ContentHealthDto,
  DescribeDishDto,
  DescribeDishResultDto,
  FillAllContentDto,
} from './dto/content-health.dto';
import {
  DraftFoodContentDto,
  FoodDraftDto,
  SaveFoodContentDto,
  SaveFoodContentResultDto,
} from './dto/food-draft.dto';

const MAX_STATUS_IDS = 50;

@ApiTags('content-health')
@Controller('content-health')
@UseGuards(AdminGuard)
export class ContentHealthController {
  constructor(private health: ContentHealthService) {}

  @Get()
  @ApiOperation({ operationId: 'getContentHealth' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: ContentHealthDto })
  report(@Query('lang') lang = 'en') {
    return this.health.report(lang);
  }

  @Get('jobs')
  @ApiOperation({ operationId: 'getAiJobs' })
  @ApiQuery({
    name: 'ids',
    required: false,
    type: String,
    description: 'Comma-separated food/category ids to report on',
  })
  @ApiResponse({ status: 200, type: AiJobsDto })
  jobs(@Query('ids') ids = '') {
    return this.health.jobs(
      ids.split(',').filter(Boolean).slice(0, MAX_STATUS_IDS),
    );
  }

  @Post('foods/:id/draft')
  @ApiOperation({ operationId: 'draftFoodContent' })
  @ApiResponse({ status: 201, type: FoodDraftDto })
  draftFood(@Param('id') id: string, @Body() dto: DraftFoodContentDto) {
    return this.health.draftFood(id, dto.describe, dto.regenerate);
  }

  @Put('foods/:id/content')
  @ApiOperation({ operationId: 'saveFoodContent' })
  @ApiResponse({ status: 200, type: SaveFoodContentResultDto })
  saveFood(@Param('id') id: string, @Body() dto: SaveFoodContentDto) {
    return this.health.saveFoodContent(id, dto.locales);
  }

  @Post('categories/:id/fill')
  @ApiOperation({ operationId: 'fillCategoryContent' })
  @ApiResponse({ status: 201, type: AiJobStatusDto })
  fillCategory(@Param('id') id: string) {
    return this.health.fillCategory(id);
  }

  @Post('fill-all')
  @ApiOperation({ operationId: 'fillAllContent' })
  @ApiResponse({ status: 201, type: AiBatchProgressDto })
  fillAll(@Body() dto: FillAllContentDto) {
    return this.health.fillAll(dto.tab);
  }

  @Post('describe')
  @ApiOperation({ operationId: 'describeDish' })
  @ApiResponse({ status: 201, type: DescribeDishResultDto })
  describe(@Body() dto: DescribeDishDto) {
    return this.health.describe(
      dto.name,
      dto.category ?? null,
      dto.lang ?? 'en',
      dto.imageKey,
    );
  }
}
