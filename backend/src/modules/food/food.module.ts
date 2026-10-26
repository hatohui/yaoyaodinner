import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { ImagesModule } from '@modules/images/images.module';
import { EventModule } from '@modules/event/event.module';

@Module({
  imports: [ImagesModule, EventModule],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
