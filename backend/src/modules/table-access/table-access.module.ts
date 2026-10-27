import { Module } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { EventModule } from '@modules/event/event.module';
import { TableAccessService } from './table-access.service';

@Module({
  imports: [ConfigModule, EventModule],
  providers: [TableAccessService],
  exports: [TableAccessService],
})
export class TableAccessModule {}
