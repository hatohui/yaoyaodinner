import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@common/guards/admin.guard';
import { SeasonalPriceService } from './seasonal-price.service';
import { SeasonalPriceDto, SetSeasonalPriceDto } from './dto/seasonal-price.dto';

@ApiTags('seasonal-prices')
@Controller('events/:eventId/seasonal-prices')
@UseGuards(AdminGuard)
export class SeasonalPriceController {
  constructor(private seasonal: SeasonalPriceService) {}

  @Get()
  @ApiOperation({ operationId: 'getSeasonalPrices' })
  @ApiQuery({ name: 'lang', required: false, type: String, example: 'en' })
  @ApiResponse({ status: 200, type: [SeasonalPriceDto] })
  findAll(@Param('eventId') eventId: string, @Query('lang') lang = 'en') {
    return this.seasonal.findAll(eventId, lang);
  }

  @Put(':variantId')
  @ApiOperation({ operationId: 'setSeasonalPrice' })
  @ApiResponse({ status: 200 })
  set(
    @Param('eventId') eventId: string,
    @Param('variantId') variantId: string,
    @Body() dto: SetSeasonalPriceDto,
  ) {
    return this.seasonal.set(eventId, variantId, dto.price);
  }
}
