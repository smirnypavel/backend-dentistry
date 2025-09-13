import { Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import mongoose from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Service health check' })
  @ApiResponse({ status: 200, description: 'Service is up' })
  getHealth() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (DB + Cloudinary config)' })
  @ApiOkResponse({ description: 'Service is ready' })
  @HttpCode(HttpStatus.OK)
  ready() {
    // Mongo readiness
    const mongoState: number = (mongoose.connection?.readyState as unknown as number) ?? 0; // 1=connected
    const mongoReady = mongoState === 1;
    // Cloudinary config presence (do not verify network)
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env as {
      CLOUDINARY_CLOUD_NAME?: string;
      CLOUDINARY_API_KEY?: string;
      CLOUDINARY_API_SECRET?: string;
    };
    const cloudinaryConfigured = Boolean(
      CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
    );

    const ready = mongoReady && cloudinaryConfigured;
    const payload = {
      ready,
      checks: {
        mongo: { ready: mongoReady, state: mongoState },
        cloudinary: { configured: cloudinaryConfigured },
      },
      ts: new Date().toISOString(),
    } as const;

    if (!ready)
      throw new HttpException(
        payload as unknown as Record<string, unknown>,
        HttpStatus.SERVICE_UNAVAILABLE,
      );

    return payload;
  }
}
