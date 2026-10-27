import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { OrderingController } from './ordering.controller';

@Module({
  controllers: [EventController, OrderingController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
