import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminAuthService } from '../admin-auth/admin-auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const hdr = req.headers['x-api-key'];
    const provided = typeof hdr === 'string' ? hdr : undefined;
    const expected = process.env.ADMIN_API_KEY;

    // accept either x-api-key (legacy) or Bearer token
    if (provided && expected) {
      if (provided !== expected) throw new ForbiddenException('Invalid admin API key');
      return true;
    }

    const authHeader =
      typeof req.headers['authorization'] === 'string' ? req.headers['authorization'] : undefined;
    const ok = await this.auth.verifyBearerToken(authHeader);
    if (!ok) {
      if (!provided) throw new UnauthorizedException('Missing x-api-key or Bearer token');
      if (!expected) throw new ForbiddenException('Admin API key is not configured');
      throw new ForbiddenException('Invalid admin API key');
    }
    return true;
  }
}
