import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { faTrashAlt, faEdit } from '@fortawesome/free-regular-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

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
export class SchedulerComponent implements OnInit {
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

  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faPlus = faPlus;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSchedules();
  }

  loadSchedules() {
    this.http.get<Schedule[]>('scheduler/list').subscribe(
      (data) => {
        this.schedules = data;
      },
      (error) => {
        console.error('Error fetching schedules:', error);
      }
    );
  }

  addSchedule() {
    this.http.post<Schedule>('scheduler/add', this.newSchedule).subscribe(
      (data) => {
        this.schedules.push(data);
        this.newSchedule = {
          id: 0,
          url: '',
          cron: '',
          folder: '',
          last_run: null,
          next_run: null,
        };
      },
      (error) => {
        console.error('Error adding schedule:', error);
      }
    );
  }

  updateSchedule() {
    if (this.editingSchedule) {
      this.http
        .post('scheduler/update', {
          ids: [this.editingSchedule.id],
          cron: this.editingSchedule.cron,
        })
        .subscribe(
          () => {
            this.loadSchedules();
            this.editingSchedule = null;
          },
          (error) => {
            console.error('Error updating schedule:', error);
          }
        );
    }
  }

  removeSchedule(id: number) {
    this.http.post('scheduler/remove', { ids: [id] }).subscribe(
      () => {
        this.schedules = this.schedules.filter((s) => s.id !== id);
      },
      (error) => {
        console.error('Error removing schedule:', error);
      }
    );
  }

  startEdit(schedule: Schedule) {
    this.editingSchedule = { ...schedule };
  }

  cancelEdit() {
    this.editingSchedule = null;
  }
}
