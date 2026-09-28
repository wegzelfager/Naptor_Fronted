import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SettingsLayoutComponent } from '../../app/layouts/settings.layout.component';
import { ProfilePage } from './pages/profile.page';
import { NotificationsPage } from './pages/notifications.page';
import { ProfileFormComponent } from './components/profile-form.component';
import { NotificationPreferencesComponent } from './components/notification-preferences.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '',              redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile',       component: ProfilePage      },
      { path: 'notifications', component: NotificationsPage },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    // Standalone components must be imported here so the module router resolves them
    SettingsLayoutComponent,
    ProfilePage,
    NotificationsPage,
    ProfileFormComponent,
    NotificationPreferencesComponent,
  ]
})
export class SettingsModule {}
