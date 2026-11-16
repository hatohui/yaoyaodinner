import { Module } from '@nestjs/common';
import { TableAccessModule } from '@modules/table-access/table-access.module';
import { TableWishController } from './table-wish.controller';
import { TableWishService } from './table-wish.service';

@Module({
  imports: [TableAccessModule],
  controllers: [TableWishController],
  providers: [TableWishService],
})
export class TableWishModule {}
