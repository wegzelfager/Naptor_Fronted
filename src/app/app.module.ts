import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Feature reducers
import { authReducer } from '../features/auth/store/auth.reducer';
import { monitorsReducer } from '../features/monitors/store/monitors.reducer';
import { heartbeatsReducer } from '../features/heartbeats/store/heartbeats.reducer';

// Feature effects
import { AuthEffects } from '../features/auth/store/auth.effects';
import { MonitorsEffects } from '../features/monitors/store/monitors.effects';
import { HeartbeatsEffects } from '../features/heartbeats/store/heartbeats.effects';

// HTTP interceptors
import { AuthInterceptor } from '../core/api/interceptors/auth.interceptor';
import { ErrorInterceptor } from '../core/api/interceptors/error.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    StoreModule.forRoot({
      auth:       authReducer,
      monitors:   monitorsReducer,
      heartbeats: heartbeatsReducer,
    }),
    EffectsModule.forRoot([AuthEffects, MonitorsEffects, HeartbeatsEffects]),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
