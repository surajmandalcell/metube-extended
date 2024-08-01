import { Component, OnInit } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Theme, Themes } from './theme';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  themes: Theme[] = Themes;
  activeTheme: Theme;
  faCheck = faCheck;

  constructor(private cookieService: CookieService) {}

  ngOnInit() {
    this.activeTheme = this.getPreferredTheme();
    this.setTheme(this.activeTheme);

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (this.activeTheme.id === 'auto') {
          this.setTheme(this.activeTheme);
        }
      });
  }

  getPreferredTheme() {
    let theme = 'auto';
    if (this.cookieService.check('metube_theme')) {
      theme = this.cookieService.get('metube_theme');
    }

    return (
      this.themes.find((x) => x.id === theme) ??
      this.themes.find((x) => x.id === 'auto')
    );
  }

  themeChanged(theme: Theme) {
    this.cookieService.set('metube_theme', theme.id, { expires: 3650 });
    this.setTheme(theme);
  }

  setTheme(theme: Theme) {
    this.activeTheme = theme;
    if (
      theme.id === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme.id);
    }
  }
}
