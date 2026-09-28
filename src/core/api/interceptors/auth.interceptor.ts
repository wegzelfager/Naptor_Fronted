import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let url = request.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    const token = localStorage.getItem('token');

    let clonedRequest = request.clone({ url });

    if (token) {
      clonedRequest = clonedRequest.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(clonedRequest);
  }
}
