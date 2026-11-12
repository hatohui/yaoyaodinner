import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import type { WorkerTask } from './dto/worker-task.dto';

export const WORKER_PATH = '/api/worker';
export const WORKER_KEY_HEADER = 'x-worker-key';

const FUNCTION_NAME = process.env.AWS_LAMBDA_FUNCTION_NAME;
const WORKER_SECRET = process.env.AI_JOB_SECRET ?? '';

/**
 * Starts background work in its own Lambda invocation. The event is shaped like a
 * function URL request, so the Lambda Web Adapter routes it to POST /api/worker
 * instead of the cron pass-through path.
 */
@Injectable()
export class WorkerService {
  private lambda: LambdaClient | null = null;

  isAuthorized(key: string | undefined) {
    if (!WORKER_SECRET || !key) return false;
    const expected = Buffer.from(WORKER_SECRET);
    const given = Buffer.from(key);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  async dispatch(task: WorkerTask, runLocally: () => Promise<unknown>, job?: object) {
    if (!FUNCTION_NAME) {
      setImmediate(() => void runLocally());
      return;
    }
    if (!WORKER_SECRET) throw new Error('AI_JOB_SECRET is not set');
    this.lambda ??= new LambdaClient({});
    const now = new Date();
    await this.lambda.send(
      new InvokeCommand({
        FunctionName: FUNCTION_NAME,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          version: '2.0',
          routeKey: '$default',
          rawPath: WORKER_PATH,
          rawQueryString: '',
          headers: {
            'content-type': 'application/json',
            [WORKER_KEY_HEADER]: WORKER_SECRET,
          },
          requestContext: {
            accountId: 'anonymous',
            apiId: 'worker',
            domainName: 'worker.internal',
            domainPrefix: 'worker',
            http: {
              method: 'POST',
              path: WORKER_PATH,
              protocol: 'HTTP/1.1',
              sourceIp: '127.0.0.1',
              userAgent: 'yaoyao-worker',
            },
            requestId: randomUUID(),
            routeKey: '$default',
            stage: '$default',
            time: now.toISOString(),
            timeEpoch: now.getTime(),
          },
          body: JSON.stringify({ task, job }),
          isBase64Encoded: false,
        }),
      }),
    );
  }
}
