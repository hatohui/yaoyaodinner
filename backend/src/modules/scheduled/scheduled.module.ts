import { Module } from '@nestjs/common';
import { TableModule } from '@modules/table/table.module';
import { ScheduledController } from './scheduled.controller';

@Module({
  imports: [TableModule],
  controllers: [ScheduledController],
})
export class ScheduledModule {}
