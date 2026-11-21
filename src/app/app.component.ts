import { Component, OnInit } from '@angular/core';
import { SessionExpiryMonitorService } from './auth/session-expiry-monitor.service';
import { CustomizerSettingsService } from './pages/externalComponents/customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {

    constructor(
        private readonly _sessionExpiry: SessionExpiryMonitorService,
        private readonly _themeService: CustomizerSettingsService
    ) {}

    ngOnInit(): void {
        this._themeService.applyTheme();
    }
}
