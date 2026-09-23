import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = resolveMessage(exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

function resolveMessage(exception: unknown): string {
  if (!(exception instanceof HttpException)) return 'Internal server error';

  const body = exception.getResponse();
  if (typeof body === 'string') return body;

  const bodyMessage = (body as { message?: unknown }).message;
  if (Array.isArray(bodyMessage)) return bodyMessage.join(', ');
  if (typeof bodyMessage === 'string') return bodyMessage;

  return exception.message;
}
