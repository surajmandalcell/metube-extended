import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import {
  faTrashAlt,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-regular-svg-icons';
import {
  faRedoAlt,
  faExternalLinkAlt,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';
import { map, Observable } from 'rxjs';

import { Download, DownloadsService, Status } from './../downloads.service';
import { MasterCheckboxComponent } from './../master-checkbox.component';
import { Formats, Format, Quality } from './../formats';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  addUrl: string;
  formats: Format[] = Formats;
  qualities: Quality[];
  quality: string;
  format: string;
  folder: string;
  customNamePrefix: string;
  autoStart: boolean;
  addInProgress = false;
  customDirs$: Observable<string[]>;

  @ViewChild('queueMasterCheckbox')
  queueMasterCheckbox: MasterCheckboxComponent;
  @ViewChild('queueDelSelected') queueDelSelected: ElementRef;
  @ViewChild('doneMasterCheckbox') doneMasterCheckbox: MasterCheckboxComponent;
  @ViewChild('doneDelSelected') doneDelSelected: ElementRef;
  @ViewChild('doneClearCompleted') doneClearCompleted: ElementRef;
  @ViewChild('doneClearFailed') doneClearFailed: ElementRef;
  @ViewChild('doneRetryFailed') doneRetryFailed: ElementRef;

  faTrashAlt = faTrashAlt;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faRedoAlt = faRedoAlt;
  faDownload = faDownload;
  faExternalLinkAlt = faExternalLinkAlt;

  constructor(
    public downloads: DownloadsService,
    private cookieService: CookieService
  ) {
    this.format = cookieService.get('metube_format') || 'any';
    this.setQualities();
    this.quality = cookieService.get('metube_quality') || 'best';
    this.autoStart = cookieService.get('metube_auto_start') !== 'false';
  }

  ngOnInit() {
    this.customDirs$ = this.getMatchingCustomDir();
  }

  ngAfterViewInit() {
    this.downloads.queueChanged.subscribe(() => {
      this.queueMasterCheckbox.selectionChanged();
    });
    this.downloads.doneChanged.subscribe(() => {
      this.doneMasterCheckbox.selectionChanged();
      let completed: number = 0,
        failed: number = 0;
      this.downloads.done.forEach((dl) => {
        if (dl.status === 'finished') completed++;
        else if (dl.status === 'error') failed++;
      });
      this.doneClearCompleted.nativeElement.disabled = completed === 0;
      this.doneClearFailed.nativeElement.disabled = failed === 0;
      this.doneRetryFailed.nativeElement.disabled = failed === 0;
    });
  }

  asIsOrder(a, b) {
    return 1;
  }

  qualityChanged() {
    this.cookieService.set('metube_quality', this.quality, { expires: 3650 });
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  showAdvanced() {
    return this.downloads.configuration['CUSTOM_DIRS'];
  }

  allowCustomDir(tag: string) {
    if (this.downloads.configuration['CREATE_CUSTOM_DIRS']) {
      return tag;
    }
    return false;
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

  formatChanged() {
    this.cookieService.set('metube_format', this.format, { expires: 3650 });
    this.setQualities();
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  autoStartChanged() {
    this.cookieService.set(
      'metube_auto_start',
      this.autoStart ? 'true' : 'false',
      { expires: 3650 }
    );
  }

  queueSelectionChanged(checked: number) {
    this.queueDelSelected.nativeElement.disabled = checked == 0;
  }

  doneSelectionChanged(checked: number) {
    this.doneDelSelected.nativeElement.disabled = checked == 0;
  }

  setQualities() {
    this.qualities = this.formats.find((el) => el.id == this.format).qualities;
    const exists = this.qualities.find((el) => el.id === this.quality);
    this.quality = exists ? this.quality : 'best';
  }

  addDownload(
    url?: string,
    quality?: string,
    format?: string,
    folder?: string,
    customNamePrefix?: string,
    autoStart?: boolean
  ) {
    url = url ?? this.addUrl;
    quality = quality ?? this.quality;
    format = format ?? this.format;
    folder = folder ?? this.folder;
    customNamePrefix = customNamePrefix ?? this.customNamePrefix;
    autoStart = autoStart ?? this.autoStart;

    console.debug(
      'Downloading: url=' +
        url +
        ' quality=' +
        quality +
        ' format=' +
        format +
        ' folder=' +
        folder +
        ' customNamePrefix=' +
        customNamePrefix +
        ' autoStart=' +
        autoStart
    );
    this.addInProgress = true;
    this.downloads
      .add(url, quality, format, folder, customNamePrefix, autoStart)
      .subscribe((status: Status) => {
        if (status.status === 'error') {
          alert(`Error adding URL: ${status.msg}`);
        } else {
          this.addUrl = '';
        }
        this.addInProgress = false;
      });
  }

  downloadItemByKey(id: string) {
    this.downloads.startById([id]).subscribe();
  }

  retryDownload(key: string, download: Download) {
    this.addDownload(
      download.url,
      download.quality,
      download.format,
      download.folder,
      download.custom_name_prefix,
      true
    );
    this.downloads.delById('done', [key]).subscribe();
  }

  delDownload(where: string, id: string) {
    this.downloads.delById(where, [id]).subscribe();
  }

  delSelectedDownloads(where: string) {
    this.downloads.delByFilter(where, (dl) => dl.checked).subscribe();
  }

  clearCompletedDownloads() {
    this.downloads
      .delByFilter('done', (dl) => dl.status === 'finished')
      .subscribe();
  }

  clearFailedDownloads() {
    this.downloads
      .delByFilter('done', (dl) => dl.status === 'error')
      .subscribe();
  }

  retryFailedDownloads() {
    this.downloads.done.forEach((dl, key) => {
      if (dl.status === 'error') {
        this.retryDownload(key, dl);
      }
    });
  }

  buildDownloadLink(download: Download) {
    let baseDir = this.downloads.configuration['PUBLIC_HOST_URL'];
    if (download.quality == 'audio' || download.filename.endsWith('.mp3')) {
      baseDir = this.downloads.configuration['PUBLIC_HOST_AUDIO_URL'];
    }

    if (download.folder) {
      baseDir += download.folder + '/';
    }

    return baseDir + encodeURIComponent(download.filename);
  }

  identifyDownloadRow(index: number, row: KeyValue<string, Download>) {
    return row.key;
  }
}
