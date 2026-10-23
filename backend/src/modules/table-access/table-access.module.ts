import { Module } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { TableAccessService } from './table-access.service';

@Module({
  imports: [ConfigModule],
  providers: [TableAccessService],
  exports: [TableAccessService],
})
export class TableAccessModule {}
