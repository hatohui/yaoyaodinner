import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AiJobsService, type AiJob } from '@modules/ai-jobs/ai-jobs.service';
import { TablePlanService } from '@modules/table/table-plan.service';
import { WorkerTaskDto } from './dto/worker-task.dto';
import { WORKER_KEY_HEADER, WorkerService } from './worker.service';

/** Background work started by WorkerService; also reachable through the public URL, hence the key. */
@ApiExcludeController()
@Controller('worker')
export class WorkerController {
  constructor(
    private worker: WorkerService,
    private jobs: AiJobsService,
    private plans: TablePlanService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  run(@Body() dto: WorkerTaskDto, @Headers(WORKER_KEY_HEADER) key?: string) {
    if (!this.worker.isAuthorized(key)) throw new UnauthorizedException();
    switch (dto.task) {
      case 'ai-job':
        if (!dto.job) throw new UnauthorizedException();
        return this.jobs.run(dto.job as AiJob);
      case 'drain-table-plans':
        return this.plans.drain();
    }
  }
}
