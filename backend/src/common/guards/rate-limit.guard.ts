import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '@libs/redis';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (limit: number, windowSeconds = 60) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds } satisfies RateLimitOptions);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest();
    const forwarded = req.headers?.['x-forwarded-for'];
    const rawForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip =
      rawForwarded?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const handler = `${context.getClass().name}:${context.getHandler().name}`;
    const key = `ratelimit:${handler}:${ip}`;
    const count = await CacheService.increment(key, options.windowSeconds);

    if (count > options.limit) {
      throw new HttpException(
        'Too many requests, please slow down',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
