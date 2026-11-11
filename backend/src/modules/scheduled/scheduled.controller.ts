import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TableAuditService } from '@modules/table/table-audit.service';
import { AiJobsService, type AiJob } from '@modules/ai-jobs/ai-jobs.service';
import { ScheduledTaskDto } from './dto/scheduled-task.dto';

const AUDIT_RETENTION_DAYS = 7;

/**
 * EventBridge Scheduler invokes the Lambda directly and the Lambda Web Adapter
 * forwards that event here (AWS_LWA_PASS_THROUGH_PATH). The route is also
 * reachable through the public function URL, so every task must be harmless
 * to run early or twice.
 */
@ApiExcludeController()
@Controller('scheduled')
export class ScheduledController {
  constructor(
    private audit: TableAuditService,
    private jobs: AiJobsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  run(@Body() dto: ScheduledTaskDto) {
    switch (dto.task) {
      case 'prune-table-audit':
        return this.audit.pruneOlderThan(AUDIT_RETENTION_DAYS);
      case 'ai-job':
        if (!this.jobs.isAuthorized(dto.key) || !dto.job) {
          throw new UnauthorizedException();
        }
        return this.jobs.run(dto.job as AiJob);
    }
  }
}
