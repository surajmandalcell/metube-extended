import { BrowserModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CookieService } from 'ngx-cookie-service';

import {
  EtaPipe,
  SpeedPipe,
  EncodeURIComponent,
  FileSizePipe,
} from './downloads.pipe';
import {
  MasterCheckboxComponent,
  SlaveCheckboxComponent,
} from './master-checkbox.component';
import { MeTubeSocket } from './metube-socket';
import { NgSelectModule } from '@ng-select/ng-select';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SchedulerComponent,
    EtaPipe,
    SpeedPipe,
    FileSizePipe,
    EncodeURIComponent,
    MasterCheckboxComponent,
    SlaveCheckboxComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    FontAwesomeModule,
    NgSelectModule,
    AppRoutingModule,
    ServiceWorkerModule.register('custom-service-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [CookieService, MeTubeSocket],
  bootstrap: [AppComponent],
})
export class AppModule {}
