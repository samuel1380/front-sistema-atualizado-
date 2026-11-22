import { Component } from '@angular/core';
import { ToggleService } from '../header/toggle.service';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

    panelOpenState = false;

    isToggled = false;

    constructor(
        private toggleService: ToggleService,
        public themeService: CustomizerSettingsService,
        private authUserService: AuthUserService,
    ) {
        this.toggleService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
    }

    toggle() {
        this.toggleService.toggle();
    }

    fecharMobile() {
        if (typeof window !== 'undefined' && window.innerWidth < 992) {
            this.toggleService.setToggleStatus(false);
        }
    }

    onSidebarClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target && target.closest('.sidemenu-link, a[routerLink]')) {
            this.fecharMobile();
        }
    }

    toggleSidebarTheme() {
        this.themeService.toggleSidebarTheme();
    }

    toggleHideSidebarTheme() {
        this.themeService.toggleHideSidebarTheme();
    }

    permite(permission: string[]) {
      return this.authUserService.hasAnyRole(permission);
    }

}
