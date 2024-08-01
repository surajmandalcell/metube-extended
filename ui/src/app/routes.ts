import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { SchedulerComponent } from './scheduler/scheduler.component';

const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'scheduler', component: SchedulerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
