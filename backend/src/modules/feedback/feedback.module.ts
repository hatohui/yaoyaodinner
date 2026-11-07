import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { EventModule } from '@modules/event/event.module';
import { ImagesModule } from '@modules/images/images.module';
import { TableAccessModule } from '@modules/table-access/table-access.module';

@Module({
  imports: [EventModule, ImagesModule, TableAccessModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
