import { Module } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { EventModule } from '@modules/event/event.module';
import { TableAuditService } from '@modules/table/table-audit.service';
import { TableAccessService } from './table-access.service';

@Module({
  imports: [ConfigModule, EventModule],
  providers: [TableAccessService, TableAuditService],
  exports: [TableAccessService, TableAuditService],
})
export class TableAccessModule {}
