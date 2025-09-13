import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId: string | undefined =
      (request.headers['x-request-id'] as string | undefined) ||
      // some middlewares attach id
      (request as unknown as { id?: string }).id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal Server Error';
    let error: string | undefined = 'Internal Server Error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = obj.message ?? message;
        error = (obj.error as string) || exception.name;
        details = obj.details ?? undefined;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request?.url,
      requestId,
      timestamp: new Date().toISOString(),
      ...(details !== undefined ? { details } : {}),
    });
  }
}
