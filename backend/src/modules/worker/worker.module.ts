import { Global, Module } from '@nestjs/common';
import { TableModule } from '@modules/table/table.module';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Global()
@Module({
  imports: [TableModule],
  controllers: [WorkerController],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
