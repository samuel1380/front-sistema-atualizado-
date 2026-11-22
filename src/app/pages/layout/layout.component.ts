import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CustomizerSettingsService } from '../externalComponents/customizer-settings/customizer-settings.service';
import { ToggleService } from '../../components/common/header/toggle.service';
import { AuthUserService } from '../../serviceStorage/authUser.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {

  showSpinner: boolean = false;
  userName: string = "";
  isAdmin: boolean = false;
  currentUser: any = null;

  tipoUsuario: string = '';

  title = 'Odontoprint';
  isToggled = false;

  constructor(private changeDetectorRef: ChangeDetectorRef,
    public router: Router,
    private toggleService: ToggleService,
    private authService: AuthUserService,
    public themeService: CustomizerSettingsService) {

    this.toggleService.isToggled$.subscribe(isToggled => {
      this.isToggled = isToggled;
      if (typeof document !== 'undefined') {
        if (isToggled && typeof window !== 'undefined' && window.innerWidth < 992) {
          document.body.classList.add('mobile-drawer-open');
        } else {
          document.body.classList.remove('mobile-drawer-open');
        }
      }
    });

    // Fecha a sidebar automaticamente ao navegar em telas mobile/tablet
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (typeof window !== 'undefined' && window.innerWidth < 992 && this.isToggled) {
        this.toggleService.setToggleStatus(false);
      }
      if (typeof document !== 'undefined') {
        document.body.classList.remove('mobile-drawer-open');
      }
    });
  }

  fecharSidebarMobile() {
    this.toggleService.setToggleStatus(false);
  }

  ngOnInit(): void {
    const currentUserString = localStorage.getItem("currentUser");
    this.currentUser = currentUserString && JSON.parse(currentUserString);

    this.authService.login(this.currentUser);

    this.authService.isLogged$.subscribe(currentUserAtual => {
      if (!currentUserAtual) {
        localStorage.removeItem('currentUser');
        const extra = this.authService.consumePendingLoginQueryParams();
        this.router.navigate([''], { queryParams: extra ?? undefined });
      }
    });

    this.tipoUsuario = this.currentUser.tipoUsuario;
  }


  toggleRightSidebarTheme() {
    this.themeService.toggleRightSidebarTheme();
  }

  toggleHideSidebarTheme() {
      this.themeService.toggleHideSidebarTheme();
  }

  toggleCardBorderTheme() {
      this.themeService.toggleCardBorderTheme();
  }

  toggleTheme() {
      this.themeService.toggleTheme();
  }

  toggleCardBorderRadiusTheme() {
      this.themeService.toggleCardBorderRadiusTheme();
  }

  toggleRTLEnabledTheme() {
      this.themeService.toggleRTLEnabledTheme();
  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }
}
