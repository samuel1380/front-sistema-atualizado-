import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CustomizerSettingsService {

    private isDarkTheme: boolean = false;
    private isSidebarDarkTheme: boolean = false;
    private isRightSidebarTheme: boolean = false;
    private isHideSidebarTheme: boolean = false;
    private isHeaderDarkTheme: boolean = false;
    private isCardBorderTheme: boolean = false;
    private isCardBorderRadiusTheme: boolean = false;
    private isRTLEnabledTheme: boolean = false;

    private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
    public isDarkTheme$ = this.isDarkThemeSubject.asObservable();

    private isToggled = new BehaviorSubject<boolean>(false);
    public isToggled$ = this.isToggled.asObservable();

    constructor() {
        this.loadSettings();
        this.applyTheme();
    }

    private loadSettings(): void {
        try {
            const darkStored = localStorage.getItem('isDarkTheme');
            this.isDarkTheme = darkStored !== null ? JSON.parse(darkStored) : false;

            const sidebarDarkStored = localStorage.getItem('isSidebarDarkTheme');
            this.isSidebarDarkTheme = sidebarDarkStored !== null ? JSON.parse(sidebarDarkStored) : false;

            const rightSidebarStored = localStorage.getItem('isRightSidebarTheme');
            this.isRightSidebarTheme = rightSidebarStored !== null ? JSON.parse(rightSidebarStored) : false;

            const hideSidebarStored = localStorage.getItem('isHideSidebarTheme');
            this.isHideSidebarTheme = hideSidebarStored !== null ? JSON.parse(hideSidebarStored) : false;

            const headerDarkStored = localStorage.getItem('isHeaderDarkTheme');
            this.isHeaderDarkTheme = headerDarkStored !== null ? JSON.parse(headerDarkStored) : false;

            const cardBorderStored = localStorage.getItem('isCardBorderTheme');
            this.isCardBorderTheme = cardBorderStored !== null ? JSON.parse(cardBorderStored) : false;

            const cardBorderRadiusStored = localStorage.getItem('isCardBorderRadiusTheme');
            this.isCardBorderRadiusTheme = cardBorderRadiusStored !== null ? JSON.parse(cardBorderRadiusStored) : false;

            const rtlStored = localStorage.getItem('isRTLEnabledTheme');
            this.isRTLEnabledTheme = rtlStored !== null ? JSON.parse(rtlStored) : false;
        } catch (e) {
            this.isDarkTheme = false;
        }
        this.isDarkThemeSubject.next(this.isDarkTheme);
    }

    public applyTheme(): void {
        if (typeof document === 'undefined') return;

        const body = document.body;
        if (this.isDarkTheme) {
            body.classList.add('dark-theme');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            document.documentElement.removeAttribute('data-theme');
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        localStorage.setItem('isDarkTheme', JSON.stringify(this.isDarkTheme));
        this.isDarkThemeSubject.next(this.isDarkTheme);
        this.applyTheme();
    }

    setDarkTheme(isDark: boolean) {
        this.isDarkTheme = !!isDark;
        localStorage.setItem('isDarkTheme', JSON.stringify(this.isDarkTheme));
        this.isDarkThemeSubject.next(this.isDarkTheme);
        this.applyTheme();
    }

    toggleSidebarTheme() {
        this.isSidebarDarkTheme = !this.isSidebarDarkTheme;
        localStorage.setItem('isSidebarDarkTheme', JSON.stringify(this.isSidebarDarkTheme));
    }

    toggleRightSidebarTheme() {
        this.isRightSidebarTheme = !this.isRightSidebarTheme;
        localStorage.setItem('isRightSidebarTheme', JSON.stringify(this.isRightSidebarTheme));
    }

    toggleHideSidebarTheme() {
        this.isHideSidebarTheme = !this.isHideSidebarTheme;
        localStorage.setItem('isHideSidebarTheme', JSON.stringify(this.isHideSidebarTheme));
    }

    toggleHeaderTheme() {
        this.isHeaderDarkTheme = !this.isHeaderDarkTheme;
        localStorage.setItem('isHeaderDarkTheme', JSON.stringify(this.isHeaderDarkTheme));
    }

    toggleCardBorderTheme() {
        this.isCardBorderTheme = !this.isCardBorderTheme;
        localStorage.setItem('isCardBorderTheme', JSON.stringify(this.isCardBorderTheme));
    }

    toggleCardBorderRadiusTheme() {
        this.isCardBorderRadiusTheme = !this.isCardBorderRadiusTheme;
        localStorage.setItem('isCardBorderRadiusTheme', JSON.stringify(this.isCardBorderRadiusTheme));
    }

    toggleRTLEnabledTheme() {
        this.isRTLEnabledTheme = !this.isRTLEnabledTheme;
        localStorage.setItem('isRTLEnabledTheme', JSON.stringify(this.isRTLEnabledTheme));
    }

    isDark(): boolean {
        return !!this.isDarkTheme;
    }

    isSidebarDark(): boolean {
        return !!this.isSidebarDarkTheme;
    }

    isRightSidebar(): boolean {
        return !!this.isRightSidebarTheme;
    }

    isHideSidebar(): boolean {
        return !!this.isHideSidebarTheme;
    }

    isHeaderDark(): boolean {
        return !!this.isHeaderDarkTheme;
    }

    isCardBorder(): boolean {
        return !!this.isCardBorderTheme;
    }

    isCardBorderRadius(): boolean {
        return !!this.isCardBorderRadiusTheme;
    }

    isRTLEnabled(): boolean {
        return !!this.isRTLEnabledTheme;
    }

    toggle() {
        this.isToggled.next(!this.isToggled.value);
    }

}
