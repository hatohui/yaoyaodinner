import { Module } from '@nestjs/common';
import { ImagesModule } from '@modules/images/images.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { OrderingController } from './ordering.controller';

@Module({
  imports: [ImagesModule],
  controllers: [EventController, OrderingController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
