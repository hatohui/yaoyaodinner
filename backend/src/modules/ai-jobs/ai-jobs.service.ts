import { ConflictException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AiService, type DraftMode } from '@libs/ai';
import { CacheService } from '@libs/redis';
import { ImagesService } from '@modules/images/images.service';
import { WorkerService } from '@modules/worker/worker.service';

export type BatchItem =
  | {
      kind: 'food';
      id: string;
      describe?: boolean;
      mode?: DraftMode;
      sourceLang?: string;
    }
  | { kind: 'category'; id: string };

export type AiJob =
  | BatchItem
  | { kind: 'preset-note'; id: string; lang: string; note: string }
  | { kind: 'batch'; batchId: string; items: BatchItem[]; offset: number };

export type JobStatus = 'pending' | 'failed' | 'done';
export type BatchProgress = {
  id: string;
  total: number;
  done: number;
  failed: number;
};

const STATUS_PREFIX = 'ai-job:';
const BATCH_KEY = 'ai-job-batch';
const PENDING_TTL = 5 * 60;
const BATCH_TTL = 45 * 60;
const FAILED_TTL = 30 * 60;
const BATCH_BUDGET_MS = 60_000;
const TRANSLATE_GROUP_SIZE = 10;
const DESCRIBE_GROUP_SIZE = 4;
const MIN_REQUEST_GAP_MS = 6_500;

const FUNCTION_NAME = process.env.AWS_LAMBDA_FUNCTION_NAME;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiJobsService {
  constructor(
    private images: ImagesService,
    private worker: WorkerService,
  ) {}

  private loadImage = (key: string) => this.images.readImage(key);

  async enqueue(job: Exclude<AiJob, { kind: 'batch' }>) {
    await CacheService.set(STATUS_PREFIX + job.id, 'pending', PENDING_TTL);
    await this.dispatch(job);
  }

  async enqueueBatch(items: BatchItem[]): Promise<BatchProgress> {
    if (await this.batch()) {
      throw new ConflictException('An AI batch is already running');
    }
    const progress = { id: uuidv4(), total: items.length, done: 0, failed: 0 };
    if (items.length === 0) return progress;

    await CacheService.set(BATCH_KEY, progress, BATCH_TTL);
    await Promise.all(
      items.map((item) =>
        CacheService.set(STATUS_PREFIX + item.id, 'pending', BATCH_TTL),
      ),
    );
    await this.dispatch({ kind: 'batch', batchId: progress.id, items, offset: 0 });
    return progress;
  }

  async statuses(ids: string[]) {
    return Promise.all(
      ids.map(async (id) => ({
        id,
        status:
          (await CacheService.get<JobStatus>(STATUS_PREFIX + id)) ?? ('done' as const),
      })),
    );
  }

  batch() {
    return CacheService.get<BatchProgress>(BATCH_KEY);
  }

  async run(job: AiJob) {
    if (job.kind === 'batch') return this.runBatch(job);
    await this.finish(job.id, await this.execute(job));
  }

  private async execute(job: Exclude<AiJob, { kind: 'batch' }>) {
    try {
      switch (job.kind) {
        case 'food':
          return (
            await AiService.fillFood(job.id, {
              describe: job.describe,
              mode: job.mode,
              sourceLang: job.sourceLang,
              loadImage: this.loadImage,
            })
          ).ok;
        case 'category':
          return (await AiService.fillCategory(job.id)).ok;
        case 'preset-note':
          return AiService.translatePresetNote(job.id, job.lang, job.note);
      }
    } catch (err) {
      console.error(`[AI job] ${job.kind} ${job.id} failed`, err);
      return false;
    }
  }

  private nextGroup(items: BatchItem[], start: number): BatchItem[] {
    const first = items[start];
    if (first.kind !== 'food') return [first];
    const size = first.describe ? DESCRIBE_GROUP_SIZE : TRANSLATE_GROUP_SIZE;
    const group: BatchItem[] = [];
    for (let i = start; i < items.length && group.length < size; i++) {
      const item = items[i];
      if (item.kind !== 'food' || Boolean(item.describe) !== Boolean(first.describe)) break;
      group.push(item);
    }
    return group;
  }

  private async executeGroup(group: BatchItem[]): Promise<Record<string, boolean>> {
    const [first] = group;
    if (first.kind !== 'food' || group.length === 1) {
      return { [first.id]: await this.execute(first) };
    }
    try {
      return await AiService.fillFoods(
        group.map((item) => item.id),
        { describe: first.describe, loadImage: this.loadImage },
      );
    } catch (err) {
      console.error('[AI job] dish group failed', err);
      return Object.fromEntries(group.map((item) => [item.id, false]));
    }
  }

  private async runBatch(job: Extract<AiJob, { kind: 'batch' }>) {
    const startedAt = Date.now();
    let i = job.offset;
    while (i < job.items.length) {
      const progress = await this.batch();
      if (progress?.id !== job.batchId) return;

      if (FUNCTION_NAME && Date.now() - startedAt > BATCH_BUDGET_MS) {
        await this.dispatch({ ...job, offset: i });
        return;
      }

      const groupStartedAt = Date.now();
      const group = this.nextGroup(job.items, i);
      const results = await this.executeGroup(group);
      const failed = group.filter((item) => !results[item.id]).length;
      await Promise.all(
        group.map((item) => this.finish(item.id, Boolean(results[item.id]))),
      );
      await CacheService.set(
        BATCH_KEY,
        {
          ...progress,
          done: progress.done + group.length,
          failed: progress.failed + failed,
        },
        BATCH_TTL,
      );

      i += group.length;
      const wait = MIN_REQUEST_GAP_MS - (Date.now() - groupStartedAt);
      if (wait > 0 && i < job.items.length) await sleep(wait);
    }
    await CacheService.delete(BATCH_KEY);
  }

  private async finish(id: string, ok: boolean) {
    if (ok) await CacheService.delete(STATUS_PREFIX + id);
    else await CacheService.set(STATUS_PREFIX + id, 'failed', FAILED_TTL);
  }

  private async dispatch(job: AiJob) {
    try {
      await this.worker.dispatch('ai-job', () => this.run(job), job);
    } catch (err) {
      console.error(`[AI job] Failed to dispatch ${job.kind}`, err);
      const ids = job.kind === 'batch' ? job.items.slice(job.offset).map((i) => i.id) : [job.id];
      await Promise.all(ids.map((id) => this.finish(id, false)));
      if (job.kind === 'batch') await CacheService.delete(BATCH_KEY);
    }
  }
}
