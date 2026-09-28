import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonitorsPage } from './pages/monitors.page';
import { MonitorDetailPage } from './pages/monitor-detail.page';

const routes: Routes = [
  { path: '', component: MonitorsPage },
  { path: ':id', component: MonitorDetailPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MonitorsRoutingModule {}
