import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches every exception (both HttpException instances and raw JS errors
 * that slipped through uncaught) so the API always returns a consistent
 * JSON shape, and every unhandled error gets logged server-side instead
 * of silently returning an opaque 500 to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response_body = exception.getResponse();
      if (typeof response_body === 'string') {
        message = response_body;
      } else if (typeof response_body === 'object' && response_body !== null) {
        const body = response_body as {
          message?: string | string[];
          error?: string;
        };
        message = body.message ?? exception.message;
        error = body.error ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Log the full stack for genuinely unexpected errors — these are
      // the ones we actually need to go debug, unlike a validated 400.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
