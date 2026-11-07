import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_HEADER } from '@common/auth/admin';
import { ConfigService } from '@modules/config/config.service';

export const FEATURE_KEY = 'required_features';

export const RequireFeature = (...keys: string[]) =>
  SetMetadata(FEATURE_KEY, keys);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const keys = this.reflector.getAllAndOverride<string[] | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!keys?.length) return true;

    const request = context.switchToHttp().getRequest();
    const raw = request.headers?.[ADMIN_HEADER];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    const passphrase = await this.config.getAdminPassphrase();
    if (provided && passphrase && provided === passphrase) {
      return true;
    }

    for (const key of keys) {
      const enabled = await this.config.get<boolean>(key);
      if (!enabled) {
        throw new ForbiddenException('This feature is currently disabled');
      }
    }

    return true;
  }
}
