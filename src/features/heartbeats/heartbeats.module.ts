import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components — standalone; imported directly where needed
import { HeartbeatDotStripComponent } from './components/heartbeat-dot-strip.component';
import { HeartbeatChartComponent } from './components/heartbeat-chart.component';

/**
 * HeartbeatsModule — lazy-loaded feature module.
 *
 * All heartbeat components are standalone and imported directly in the pages
 * that consume them (e.g. MonitorDetailPage). This module exists as a grouping
 * boundary and is imported by MonitorsModule for feature-level organisation.
 *
 * The NgRx heartbeats slice (reducer + effects) is registered at root level
 * in AppModule so it's available globally for the SSE listener.
 */
@NgModule({
  imports: [
    CommonModule,
    HeartbeatDotStripComponent,
    HeartbeatChartComponent,
  ],
  exports: [
    HeartbeatDotStripComponent,
    HeartbeatChartComponent,
  ],
})
export class HeartbeatsModule {}
