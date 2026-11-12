import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const SCHEDULED_TASKS = ['prune-table-audit', 'ai-job'] as const;
export type ScheduledTask = (typeof SCHEDULED_TASKS)[number];

export class ScheduledTaskDto {
  @IsIn(SCHEDULED_TASKS)
  task: ScheduledTask;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsObject()
  job?: Record<string, unknown>;
}
