import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, interval } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  buscarLogs,
  ListarLogsResponse,
  LogAuditoriaItem,
} from 'src/services/logs.service';
import { LogDetalheDialogComponent } from './log-detalhe-dialog/log-detalhe-dialog.component';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogAuditoriaItem[] = [];
  total = 0;
  page = 1;
  limit = 30;
  totalPages = 1;

  resumo = {
    totalGeral: 0,
    criacoes: 0,
    atualizacoes: 0,
    exclusoes: 0,
    logins: 0,
    acoes: 0,
  };

  modulosDisponiveis: string[] = [];
  usuariosDisponiveis: { idUsuario: number; nomeUsuario: string; emailUsuario: string | null }[] = [];

  // Filtros
  busca = '';
  modulo = '';
  acao = '';
  idUsuario: number | null = null;
  dataInicio = '';
  dataFim = '';

  carregando = false;
  erro: string | null = null;
  autoAtualizar = false;
  ultimaAtualizacao: Date | null = null;

  private static readonly AUTO_ATUALIZAR_STORAGE_KEY = 'logs_auto_atualizar';

  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog) {
    try {
      this.autoAtualizar = localStorage.getItem(LogsComponent.AUTO_ATUALIZAR_STORAGE_KEY) === 'true';
    } catch {
      this.autoAtualizar = false;
    }
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(320), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        void this.carregarLogs();
      });

    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoAtualizar && !this.carregando) {
          void this.carregarLogs(true);
        }
      });

    void this.carregarLogs();
  }

  toggleAutoAtualizar(): void {
    this.autoAtualizar = !this.autoAtualizar;
    try {
      localStorage.setItem(LogsComponent.AUTO_ATUALIZAR_STORAGE_KEY, String(this.autoAtualizar));
    } catch {
      // ignora indisponibilidade de storage
    }
    if (this.autoAtualizar) {
      void this.carregarLogs(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltroTextoChange(): void {
    this.search$.next();
  }

  aplicarFiltros(): void {
    this.page = 1;
    void this.carregarLogs();
  }

  limparFiltros(): void {
    this.busca = '';
    this.modulo = '';
    this.acao = '';
    this.idUsuario = null;
    this.dataInicio = '';
    this.dataFim = '';
    this.page = 1;
    void this.carregarLogs();
  }

  aplicarPeriodoRapido(tipo: 'hoje' | '7d' | 'mes'): void {
    const hoje = new Date();
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    this.dataFim = formatDate(hoje);
    if (tipo === 'hoje') {
      this.dataInicio = formatDate(hoje);
    } else if (tipo === '7d') {
      const d7 = new Date(hoje);
      d7.setDate(d7.getDate() - 6);
      this.dataInicio = formatDate(d7);
    } else {
      const d1 = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      this.dataInicio = formatDate(d1);
    }
    this.aplicarFiltros();
  }

  async carregarLogs(silencioso = false): Promise<void> {
    if (!silencioso) {
      this.carregando = true;
    }
    this.erro = null;

    try {
      const res = await buscarLogs({
        page: this.page,
        limit: this.limit,
        busca: this.busca.trim() || undefined,
        modulo: this.modulo || undefined,
        acao: this.acao || undefined,
        idUsuario: this.idUsuario ?? undefined,
        dataInicio: this.dataInicio || undefined,
        dataFim: this.dataFim || undefined,
      });

      const data = res.data as ListarLogsResponse;
      if (!data || !Array.isArray(data.items)) {
        throw new Error('Resposta inválida ao buscar logs.');
      }
      this.logs = data.items;
      this.total = data.total || 0;
      this.page = data.page || 1;
      this.totalPages = data.totalPages || 1;
      this.resumo = data.resumo || this.resumo;
      this.modulosDisponiveis = data.filtrosDisponiveis?.modulos || [];
      this.usuariosDisponiveis = data.filtrosDisponiveis?.usuarios || [];
      this.ultimaAtualizacao = new Date();
    } catch (err: any) {
      console.error('Erro ao carregar logs de auditoria:', err);
      this.erro = err?.response?.data?.message || 'Não foi possível carregar os logs do sistema.';
    } finally {
      this.carregando = false;
    }
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina < 1 || novaPagina > this.totalPages || novaPagina === this.page) {
      return;
    }
    this.page = novaPagina;
    void this.carregarLogs();
  }

  onLimitChange(): void {
    this.page = 1;
    void this.carregarLogs();
  }

  abrirDetalhes(log: LogAuditoriaItem): void {
    this.dialog.open(LogDetalheDialogComponent, {
      data: log,
      width: '880px',
      maxWidth: '95vw',
      panelClass: 'logs-detalhe-dialog-panel',
    });
  }

  exportarCsv(): void {
    if (!this.logs.length) return;
    const escapeCsv = (val: any) => {
      const s = val == null ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      'ID Log',
      'Data/Hora',
      'Usuario',
      'Email',
      'Acao',
      'Modulo',
      'Entidade',
      'ID Registro',
      'Resumo',
      'Metodo',
      'Rota',
      'IP',
    ];

    const rows = this.logs.map((l) =>
      [
        l.idLog,
        new Date(l.dataHora).toLocaleString('pt-BR'),
        l.nomeUsuario || 'Sistema (Automático)',
        l.emailUsuario || '',
        this.getAcaoLabel(l.acao),
        l.modulo,
        l.entidade,
        l.idRegistro || '',
        l.resumo,
        l.metodoHttp || '',
        l.rota || '',
        l.ip || '',
      ]
        .map(escapeCsv)
        .join(';'),
    );

    const csv = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-sistema-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getAcaoBadgeClass(acao: string): string {
    switch (acao) {
      case 'CRIACAO':
        return 'acao-criacao';
      case 'ATUALIZACAO':
        return 'acao-atualizacao';
      case 'EXCLUSAO':
        return 'acao-exclusao';
      case 'LOGIN':
        return 'acao-login';
      default:
        return 'acao-outro';
    }
  }

  getAcaoIcon(acao: string): string {
    switch (acao) {
      case 'CRIACAO':
        return 'ri-add-circle-line';
      case 'ATUALIZACAO':
        return 'ri-edit-line';
      case 'EXCLUSAO':
        return 'ri-delete-bin-line';
      case 'LOGIN':
        return 'ri-login-box-line';
      default:
        return 'ri-flashlight-line';
    }
  }

  getAcaoLabel(acao: string): string {
    switch (acao) {
      case 'CRIACAO':
        return 'Criação';
      case 'ATUALIZACAO':
        return 'Alteração';
      case 'EXCLUSAO':
        return 'Exclusão';
      case 'LOGIN':
        return 'Login';
      default:
        return 'Ação';
    }
  }

  getIniciais(nome: string | null): string {
    if (!nome) return 'SI';
    const parts = nome.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarColor(nome: string | null): string {
    const palette = [
      '#4f46e5',
      '#0891b2',
      '#059669',
      '#d97706',
      '#db2777',
      '#7c3aed',
      '#2563eb',
      '#0d9488',
    ];
    const str = nome || 'Sistema';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  getTempoRelativo(dataHora: string): string {
    const dt = new Date(dataHora).getTime();
    if (isNaN(dt)) return '';
    const diffSec = Math.floor((Date.now() - dt) / 1000);
    if (diffSec < 60) return 'agora mesmo';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'ontem';
    if (diffD < 30) return `há ${diffD} dias`;
    return '';
  }

  formatarValorCurto(val: any): string {
    if (val === null || val === undefined || val === '') return 'vazio';
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
    const s = String(val);
    return s.length > 26 ? `${s.slice(0, 26)}…` : s;
  }

  get temFiltrosAtivos(): boolean {
    return Boolean(
      this.busca ||
        this.modulo ||
        this.acao ||
        this.idUsuario != null ||
        this.dataInicio ||
        this.dataFim,
    );
  }
}
