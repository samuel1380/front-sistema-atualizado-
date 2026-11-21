import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogAuditoriaItem } from 'src/services/logs.service';

@Component({
  selector: 'app-log-detalhe-dialog',
  templateUrl: './log-detalhe-dialog.component.html',
  styleUrls: ['./log-detalhe-dialog.component.scss'],
})
export class LogDetalheDialogComponent {
  abaAtiva: 'diff' | 'json' = 'diff';

  constructor(
    public dialogRef: MatDialogRef<LogDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public log: LogAuditoriaItem,
  ) {
    if ((!log.camposAlterados || log.camposAlterados.length === 0) && (log.dadosNovos || log.dadosAnteriores)) {
      this.abaAtiva = 'json';
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  formatarValor(valor: any): string {
    if (valor === null || valor === undefined || valor === '') {
      return '— (vazio)';
    }
    if (typeof valor === 'boolean') {
      return valor ? 'Sim' : 'Não';
    }
    if (typeof valor === 'object') {
      try {
        return JSON.stringify(valor, null, 2);
      } catch {
        return String(valor);
      }
    }
    return String(valor);
  }

  formatarJson(obj: any): string {
    if (obj === null || obj === undefined) return 'Nenhum dado registrado';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  getAcaoBadgeClass(acao: string): string {
    switch (acao) {
      case 'CRIACAO':
        return 'badge-criacao';
      case 'ATUALIZACAO':
        return 'badge-atualizacao';
      case 'EXCLUSAO':
        return 'badge-exclusao';
      case 'LOGIN':
        return 'badge-login';
      default:
        return 'badge-acao';
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
}
