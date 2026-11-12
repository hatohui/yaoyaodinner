import { IsIn, IsObject, IsOptional } from 'class-validator';

export const WORKER_TASKS = ['ai-job', 'drain-table-plans'] as const;
export type WorkerTask = (typeof WORKER_TASKS)[number];

export class WorkerTaskDto {
  @IsIn(WORKER_TASKS)
  task: WorkerTask;

  @IsOptional()
  @IsObject()
  job?: Record<string, unknown>;
}
