import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IncidentsPage } from './pages/incidents.page';

const routes: Routes = [
  { path: '', component: IncidentsPage }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IncidentsPage
  ]
})
export class IncidentsModule {}
