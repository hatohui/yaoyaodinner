import { Module } from '@nestjs/common';
import { SeasonalPriceController } from './seasonal-price.controller';
import { SeasonalPriceService } from './seasonal-price.service';

@Module({
  controllers: [SeasonalPriceController],
  providers: [SeasonalPriceService],
})
export class SeasonalPriceModule {}
