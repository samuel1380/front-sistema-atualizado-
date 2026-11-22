import { Component, HostListener } from '@angular/core';
import { ToggleService } from './toggle.service';
import { DatePipe } from '@angular/common';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { buscarTrabalho, pesquisarTrabalhos } from 'src/services/trabalho.service';
import { ChangePasswordDialogComponent } from '../../change-password-dialog/change-password-dialog.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    isSticky: boolean = false;
    @HostListener('window:scroll', ['$event'])
    checkScroll() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 350) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

    isToggled = false;
    currentUser: any = {};
    pesquisaTrabalhoId: string = '';
    resultadosPesquisa: any[] = [];
    mostrarResultados: boolean = false;
    buscando: boolean = false;
    private debounceTimer: any = null;

    constructor(
        private toggleService: ToggleService,
        private authService: AuthUserService,
        private datePipe: DatePipe,
        public themeService: CustomizerSettingsService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.toggleService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });

        this.authService.isLogged$.subscribe(currentUser => {
          this.currentUser = currentUser;
        });
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    toggle() {
        this.toggleService.toggle();
    }

    toggleSidebarTheme() {
        this.themeService.toggleSidebarTheme();
    }

    toggleHideSidebarTheme() {
        this.themeService.toggleHideSidebarTheme();
    }

    toggleCardBorderTheme() {
        this.themeService.toggleCardBorderTheme();
    }

    toggleHeaderTheme() {
        this.themeService.toggleHeaderTheme();
    }

    toggleCardBorderRadiusTheme() {
        this.themeService.toggleCardBorderRadiusTheme();
    }

    toggleRTLEnabledTheme() {
        this.themeService.toggleRTLEnabledTheme();
    }

    logout() {
      this.authService.logout();
    }

    trocarSenha() {
        this.dialog.open(ChangePasswordDialogComponent, {
            width: '450px',
            disableClose: true
        });
    }

    currentDate: Date = new Date();
    formattedDate: any = this.datePipe.transform(this.currentDate, 'dd MMMM yyyy');

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.search-box')) {
            this.mostrarResultados = false;
        }
    }

    onPesquisaInput() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        const termo = this.pesquisaTrabalhoId ? this.pesquisaTrabalhoId.trim() : '';
        if (termo.length < 2) {
            this.resultadosPesquisa = [];
            this.mostrarResultados = false;
            return;
        }

        this.buscando = true;
        this.debounceTimer = setTimeout(async () => {
            try {
                const res = await pesquisarTrabalhos(termo);
                if (res && res.data) {
                    this.resultadosPesquisa = Array.isArray(res.data) ? res.data : [];
                } else {
                    this.resultadosPesquisa = [];
                }
                this.mostrarResultados = true;
            } catch (err) {
                console.error('Erro ao pesquisar trabalhos:', err);
                this.resultadosPesquisa = [];
            } finally {
                this.buscando = false;
            }
        }, 300);
    }

    onPesquisaFocus() {
        if (this.pesquisaTrabalhoId && this.pesquisaTrabalhoId.trim().length >= 2) {
            this.mostrarResultados = true;
            if (this.resultadosPesquisa.length === 0 && !this.buscando) {
                this.onPesquisaInput();
            }
        }
    }

    formatarStatus(status: string): string {
        if (!status) return '';
        return status
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatarDentista(nome: string): string {
        if (!nome) return '';
        const n = nome.trim();
        if (/^dr\.?|^dra\.?/i.test(n)) {
            return n;
        }
        return `Dr(a). ${n}`;
    }

    async executarPesquisaEnter(): Promise<void> {
        const termo = this.pesquisaTrabalhoId ? this.pesquisaTrabalhoId.trim() : '';
        if (!termo) return;

        // Se for um número exato de ID (ou começar com #), verifica se tem correspondência exata
        const numApenas = termo.replace(/[^0-9]/g, '');
        if (numApenas && (termo.startsWith('#') || /^\d+$/.test(termo))) {
            const idNumero = parseInt(numApenas, 10);
            const exactMatch = this.resultadosPesquisa.find(t => t.idTrabalho === idNumero);
            if (exactMatch) {
                this.selecionarTrabalho(exactMatch);
                return;
            }
        }

        // Se tiver apenas 1 resultado na lista atual, abre ele
        if (this.resultadosPesquisa.length === 1) {
            this.selecionarTrabalho(this.resultadosPesquisa[0]);
            return;
        }

        // Se a busca ainda não retornou resultados ou lista está vazia, busca agora
        if (!this.resultadosPesquisa.length) {
            this.buscando = true;
            try {
                const res = await pesquisarTrabalhos(termo);
                this.resultadosPesquisa = Array.isArray(res?.data) ? res.data : [];
                this.mostrarResultados = true;

                if (this.resultadosPesquisa.length === 1) {
                    this.selecionarTrabalho(this.resultadosPesquisa[0]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.buscando = false;
            }
        } else {
            this.mostrarResultados = true;
        }
    }

    selecionarTrabalho(trabalho: any): void {
        this.mostrarResultados = false;
        const idPaciente = trabalho.idPaciente || trabalho.paciente?.idPaciente;

        if (idPaciente) {
            const targetUrl = `/l/paciente/edit/${idPaciente}`;
            const currentUrl = this.router.url;

            if (currentUrl === targetUrl) {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate([targetUrl]);
                });
            } else {
                this.router.navigate([targetUrl]);
            }
            this.pesquisaTrabalhoId = '';
            this.resultadosPesquisa = [];
        } else {
            this.snackBar.open('Trabalho encontrado, mas sem paciente associado.', 'Fechar', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top'
            });
        }
    }

    apenasNumeros(event: KeyboardEvent): boolean {
        // Mantido por compatibilidade
        return true;
    }

    async buscarTrabalhoPorId(): Promise<void> {
        return this.executarPesquisaEnter();
    }

}
