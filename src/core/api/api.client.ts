// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class ApiClient {
//   private readonly baseURL = environment.apiUrl;

//   constructor(private readonly http: HttpClient) {}

//   get<T>(path: string, params?: Record<string, string | number | boolean | string[]>) {
//     const url = `${this.baseURL}/${path}`;
//     const httpParams = new HttpParams({ fromObject: params });
//     const headers = new HttpHeaders({ Accept: 'application/json' });
//     return this.http.get<T>(url, { params, headers });
//   }

//   post<T>(path: string, body: unknown, contentType = 'application/json') {
//     const url = `${this.baseURL}/${path}`;
//     const headers = new HttpHeaders({ 'Content-Type': contentType });
//     return this.http.post<T>(url, body, { headers });
//   }

//   put<T>(path: string, body: unknown, contentType = 'application/json') {
//     const url = `${this.baseURL}/${path}`;
//     const headers = new HttpHeaders({ 'Content-Type': contentType });
//     return this.http.put<T>(url, body, { headers });
//   }

//   delete<T>(path: string) {
//     const url = `${this.baseURL}/${path}`;
//     return this.http.delete<T>(url);
//   }
// }
