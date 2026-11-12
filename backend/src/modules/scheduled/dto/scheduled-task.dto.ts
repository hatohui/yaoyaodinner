import { IsIn } from 'class-validator';

export const SCHEDULED_TASKS = ['prune-table-audit'] as const;
export type ScheduledTask = (typeof SCHEDULED_TASKS)[number];

export class ScheduledTaskDto {
  @IsIn(SCHEDULED_TASKS)
  task: ScheduledTask;
}
