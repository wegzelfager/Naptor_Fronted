import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth.layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard.layout.component';
import { authGuard } from '../features/auth/guards/auth.guard';

const routes: Routes = [
  // --- Landing page (Main route) ---
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('../features/landing/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'landing',
    redirectTo: '',
    pathMatch: 'full'
  },

  // --- Auth layout (login / register / verify-email) ---
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('../features/auth/auth.module').then(m => m.AuthModule)
      }
    ]
  },

  // --- Authenticated App Routes ---
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('../features/dashboard/dashboard.module').then(m => m.DashboardModule)   },
      { path: 'monitors',  loadChildren: () => import('../features/monitors/monitors.module').then(m => m.MonitorsModule)       },
      { path: 'alerts',    loadChildren: () => import('../features/alerts/alerts.module').then(m => m.AlertsModule)             },
      { path: 'incidents', loadChildren: () => import('../features/incidents/incidents.module').then(m => m.IncidentsModule)    },
      { path: 'settings',  loadChildren: () => import('../features/settings/settings.module').then(m => m.SettingsModule)       },
    ]
  },

  // --- Fallback ---
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
