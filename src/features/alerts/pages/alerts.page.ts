import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsComponent } from '../components/alerts.component';

/** AlertsPage: hosts the Real-time Alerts dashboard connected to SSE & REST. */
@Component({
  standalone: true,
  selector: 'app-alerts-page',
  imports: [CommonModule, AlertsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-alerts></app-alerts>
  `
})
export class AlertsPage {}
