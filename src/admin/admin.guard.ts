import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const hdr = req.headers['x-api-key'];
    const provided = typeof hdr === 'string' ? hdr : undefined;
    if (!provided) {
      throw new UnauthorizedException('Missing x-api-key');
    }
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
      throw new ForbiddenException('Admin API key is not configured');
    }
    if (provided !== expected) {
      throw new ForbiddenException('Invalid admin API key');
    }
    return true;
  }
}
