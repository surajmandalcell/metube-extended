import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { faTrashAlt, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';
import { Formats, Format, Quality } from './../formats';
import { DownloadsService } from './../downloads.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

interface Schedule {
  id: number;
  url: string;
  cron: string;
  folder: string;
  last_run: string | null;
  next_run: string | null;
}

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.sass'],
})
export class SchedulerComponent implements OnInit, OnDestroy {
  schedules: Schedule[] = [];
  newSchedule: Schedule = {
    id: 0,
    url: '',
    cron: '',
    folder: '',
    last_run: null,
    next_run: null,
  };
  editingSchedule: Schedule | null = null;
  formats: Format[] = Formats;
  qualities: Quality[];
  quality: string;
  format: string;
  folder: string;
  customDirs$: Observable<string[]>;
  cronIntervals = [
    { value: '0 * * * *', label: 'Every hour' },
    { value: '0 */2 * * *', label: 'Every 2 hours' },
    { value: '0 */4 * * *', label: 'Every 4 hours' },
    { value: '0 */6 * * *', label: 'Every 6 hours' },
    { value: '0 */8 * * *', label: 'Every 8 hours' },
    { value: '0 */10 * * *', label: 'Every 10 hours' },
    { value: '0 */12 * * *', label: 'Every 12 hours' },
    { value: '0 0 * * *', label: 'Every 24 hours' },
    { value: 'custom', label: 'Custom' },
  ];
  selectedInterval = '0 * * * *';
  customCron = '';

  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faPlus = faPlus;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    public downloads: DownloadsService
  ) {
    this.format = cookieService.get('metube_format') || 'any';
    this.setQualities();
    this.quality = cookieService.get('metube_quality') || 'best';
  }

  ngOnInit() {
    this.loadSchedules();
    this.customDirs$ = this.getMatchingCustomDir();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadSchedules() {
    this.subscriptions.add(
      this.http.get<Schedule[]>('scheduler/list').subscribe({
        next: (data) => {
          this.schedules = data;
        },
        error: (error) => {
          console.error('Error fetching schedules:', error);
        },
      })
    );
  }

  addSchedule() {
    const cron =
      this.selectedInterval === 'custom'
        ? this.customCron
        : this.selectedInterval;
    this.subscriptions.add(
      this.http
        .post<Schedule>('scheduler/add', { ...this.newSchedule, cron })
        .subscribe({
          next: (data) => {
            this.schedules.push(data);
            this.resetNewSchedule();
          },
          error: (error) => {
            console.error('Error adding schedule:', error);
          },
        })
    );
  }

  resetNewSchedule() {
    this.newSchedule = {
      id: 0,
      url: '',
      cron: '',
      folder: '',
      last_run: null,
      next_run: null,
    };
    this.selectedInterval = '0 * * * *';
    this.customCron = '';
  }

  updateSchedule() {
    if (this.editingSchedule) {
      const cron =
        this.selectedInterval === 'custom'
          ? this.customCron
          : this.selectedInterval;
      this.subscriptions.add(
        this.http
          .post('scheduler/update', {
            ids: [this.editingSchedule.id],
            cron: cron,
          })
          .subscribe({
            next: () => {
              this.loadSchedules();
              this.editingSchedule = null;
            },
            error: (error) => {
              console.error('Error updating schedule:', error);
            },
          })
      );
    }
  }

  removeSchedule(id: number) {
    this.subscriptions.add(
      this.http.post('scheduler/remove', { ids: [id] }).subscribe({
        next: () => {
          this.schedules = this.schedules.filter((s) => s.id !== id);
        },
        error: (error) => {
          console.error('Error removing schedule:', error);
        },
      })
    );
  }

  startEdit(schedule: Schedule) {
    this.editingSchedule = { ...schedule };
    const cronIndex = this.cronIntervals.findIndex(
      (interval) => interval.value === schedule.cron
    );
    if (cronIndex !== -1) {
      this.selectedInterval = schedule.cron;
    } else {
      this.selectedInterval = 'custom';
      this.customCron = schedule.cron;
    }
  }

  cancelEdit() {
    this.editingSchedule = null;
    this.selectedInterval = '0 * * * *';
    this.customCron = '';
  }

  setQualities() {
    this.qualities = this.formats.find((el) => el.id == this.format).qualities;
    const exists = this.qualities.find((el) => el.id === this.quality);
    this.quality = exists ? this.quality : 'best';
  }

  formatChanged() {
    this.cookieService.set('metube_format', this.format, { expires: 3650 });
    this.setQualities();
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  qualityChanged() {
    this.cookieService.set('metube_quality', this.quality, { expires: 3650 });
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  getMatchingCustomDir(): Observable<string[]> {
    return this.downloads.customDirsChanged.asObservable().pipe(
      map((output) => {
        if (this.isAudioType()) {
          console.debug('Showing audio-specific download directories');
          return output['audio_download_dir'];
        } else {
          console.debug('Showing default download directories');
          return output['download_dir'];
        }
      })
    );
  }

  isAudioType() {
    return (
      this.quality == 'audio' ||
      this.format == 'mp3' ||
      this.format == 'm4a' ||
      this.format == 'opus' ||
      this.format == 'wav' ||
      this.format == 'flac'
    );
  }

  showAdvanced() {
    return this.downloads.configuration['CUSTOM_DIRS'];
  }
}
