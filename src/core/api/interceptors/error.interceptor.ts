import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ApiError {
  status: number;
  message: string;
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'BAD_REQUEST' | 'CONFLICT' | 'SERVER_ERROR' | 'UNKNOWN';
}

function mapHttpError(err: HttpErrorResponse): ApiError {
  const message: string =
    err.error?.message ||
    err.error?.errors?.[0]?.message ||
    err.statusText ||
    'An unexpected error occurred';

  let code: ApiError['code'] = 'UNKNOWN';
  switch (err.status) {
    case 400: code = 'BAD_REQUEST'; break;
    case 401: code = 'UNAUTHORIZED'; break;
    case 404: code = 'NOT_FOUND'; break;
    case 409: code = 'CONFLICT'; break;
    case 500: code = 'SERVER_ERROR'; break;
  }

  return { status: err.status, message, code };
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        const apiError = mapHttpError(err);

        // 401 Unauthorized — clear stale session and navigate to /login
        if (apiError.code === 'UNAUTHORIZED') {
          console.warn('[ErrorInterceptor] 401 Unauthorized — clearing invalid token.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        }

        return throwError(() => ({
          ...err,
          error: {
            ...(err.error ?? {}),
            _apiError: apiError,
            message: apiError.message,
          }
        }));
      })
    );
  }
}
