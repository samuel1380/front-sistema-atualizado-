import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaturaService, Fatura } from '../../../../../services/financeiro.fatura.service';

export interface TrocarFaturaDialogData {
  idFaturaAtual: number;
  idOrdemServico: number;
  idEmpresa: number;
}

export interface TrocarFaturaResultado {
  tipo: 'MES' | 'FATURA' | 'AUTOMATICO';
  idFaturaDestino?: number | null;
  anoDestino?: number;
  mesDestino?: number;
}

@Component({
  selector: 'app-trocar-fatura-dialog',
  templateUrl: './trocar-fatura-dialog.component.html',
  styleUrls: ['./trocar-fatura-dialog.component.sass']
})
export class TrocarFaturaDialogComponent implements OnInit {
  tipoDestino: 'MES' | 'FATURA' | 'AUTOMATICO' = 'MES';
  mesSelecionado: number;
  anoSelecionado: number;
  idFaturaSelecionada: number | null = null;

  faturasDisponiveis: Fatura[] = [];
  carregandoFaturas = false;

  meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  anos: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<TrocarFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TrocarFaturaDialogData,
    private faturaService: FaturaService
  ) {
    const hoje = new Date();
    this.mesSelecionado = hoje.getMonth() + 1;
    this.anoSelecionado = hoje.getFullYear();

    for (let a = this.anoSelecionado - 1; a <= this.anoSelecionado + 2; a++) {
      this.anos.push(a);
    }
  }

  ngOnInit(): void {
    if (this.data.idEmpresa) {
      this.carregarFaturas();
    }
  }

  carregarFaturas(): void {
    this.carregandoFaturas = true;
    this.faturaService.listarFaturasPorEmpresa(this.data.idEmpresa).subscribe({
      next: (faturas) => {
        this.faturasDisponiveis = (faturas || []).filter(
          f => f.idFatura !== this.data.idFaturaAtual && f.status === 'ABERTA'
        );
        if (this.faturasDisponiveis.length > 0) {
          this.idFaturaSelecionada = this.faturasDisponiveis[0].idFatura;
        }
        this.carregandoFaturas = false;
      },
      error: (err) => {
        console.error('Erro ao carregar faturas da empresa', err);
        this.carregandoFaturas = false;
      }
    });
  }

  onConfirm(): void {
    if (this.tipoDestino === 'MES') {
      const res: TrocarFaturaResultado = {
        tipo: 'MES',
        anoDestino: Number(this.anoSelecionado),
        mesDestino: Number(this.mesSelecionado),
      };
      this.dialogRef.close(res);
    } else if (this.tipoDestino === 'FATURA') {
      const res: TrocarFaturaResultado = {
        tipo: 'FATURA',
        idFaturaDestino: this.idFaturaSelecionada,
      };
      this.dialogRef.close(res);
    } else {
      const res: TrocarFaturaResultado = {
        tipo: 'AUTOMATICO',
        idFaturaDestino: null,
      };
      this.dialogRef.close(res);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
