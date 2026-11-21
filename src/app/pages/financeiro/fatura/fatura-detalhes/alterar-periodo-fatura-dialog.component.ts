import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaturaService, AtualizarPeriodoFaturaPayload } from '../../../../../services/financeiro.fatura.service';

export interface AlterarPeriodoFaturaDialogData {
  idFatura: number;
  dataInicio?: string;
  dataFim?: string;
  dataVencimento?: string;
  nomeEmpresa?: string;
}

@Component({
  selector: 'app-alterar-periodo-fatura-dialog',
  templateUrl: './alterar-periodo-fatura-dialog.component.html',
  styleUrls: ['./alterar-periodo-fatura-dialog.component.sass']
})
export class AlterarPeriodoFaturaDialogComponent implements OnInit {
  form: FormGroup;
  salvando = false;

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
    public dialogRef: MatDialogRef<AlterarPeriodoFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlterarPeriodoFaturaDialogData,
    private fb: FormBuilder,
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {
    const anoAtual = new Date().getFullYear();
    for (let a = anoAtual - 2; a <= anoAtual + 2; a++) {
      this.anos.push(a);
    }

    let mesInicial = new Date().getMonth() + 1;
    let anoInicial = anoAtual;

    if (data.dataInicio) {
      const d = new Date(data.dataInicio);
      if (!isNaN(d.getTime())) {
        mesInicial = d.getUTCMonth() + 1;
        anoInicial = d.getUTCFullYear();
      }
    }

    const dataInicioStr = this.formatDateOnly(data.dataInicio) || `${anoInicial}-${String(mesInicial).padStart(2, '0')}-01`;
    const dataFimStr = this.formatDateOnly(data.dataFim) || this.calcularUltimoDiaMesStr(anoInicial, mesInicial);
    const dataVencStr = this.formatDateOnly(data.dataVencimento) || this.calcularVencimentoPadraoStr(anoInicial, mesInicial);

    this.form = this.fb.group({
      mes: [mesInicial, Validators.required],
      ano: [anoInicial, Validators.required],
      dataInicio: [dataInicioStr, Validators.required],
      dataFim: [dataFimStr, Validators.required],
      dataVencimento: [dataVencStr, Validators.required],
      motivo: ['']
    });
  }

  ngOnInit(): void {
    this.form.get('mes')?.valueChanges.subscribe(() => this.atualizarDatasPorMesEAno());
    this.form.get('ano')?.valueChanges.subscribe(() => this.atualizarDatasPorMesEAno());
  }

  private formatDateOnly(val?: string): string {
    if (!val) return '';
    if (val.length >= 10) {
      return val.substring(0, 10);
    }
    return '';
  }

  private calcularUltimoDiaMesStr(ano: number, mes: number): string {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
  }

  private calcularVencimentoPadraoStr(ano: number, mes: number): string {
    let proximoMes = mes + 1;
    let proximoAno = ano;
    if (proximoMes > 12) {
      proximoMes = 1;
      proximoAno += 1;
    }
    return `${proximoAno}-${String(proximoMes).padStart(2, '0')}-20`;
  }

  private atualizarDatasPorMesEAno(): void {
    const mes = Number(this.form.get('mes')?.value);
    const ano = Number(this.form.get('ano')?.value);
    if (mes && ano) {
      const dataInicioStr = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const dataFimStr = this.calcularUltimoDiaMesStr(ano, mes);
      const dataVencStr = this.calcularVencimentoPadraoStr(ano, mes);

      this.form.patchValue({
        dataInicio: dataInicioStr,
        dataFim: dataFimStr,
        dataVencimento: dataVencStr
      }, { emitEvent: false });
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Preencha os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const { dataInicio, dataFim, dataVencimento, motivo } = this.form.value;

    if (new Date(dataFim) < new Date(dataInicio)) {
      this.snackBar.open('A data final não pode ser anterior à data inicial.', 'Fechar', { duration: 3000 });
      return;
    }

    this.salvando = true;
    const payload: AtualizarPeriodoFaturaPayload = {
      dataInicio,
      dataFim,
      dataVencimento,
      motivo: motivo || undefined
    };

    this.faturaService.atualizarPeriodoFatura(this.data.idFatura, payload).subscribe({
      next: (faturaAtualizada) => {
        this.salvando = false;
        this.snackBar.open(`Período da Fatura #${this.data.idFatura} alterado com sucesso!`, 'Fechar', { duration: 4000 });
        this.dialogRef.close(faturaAtualizada || true);
      },
      error: (err) => {
        this.salvando = false;
        console.error('Erro ao atualizar período da fatura', err);
        this.snackBar.open(
          err?.error?.message || err?.error?.resposta || 'Erro ao alterar período da fatura.',
          'Fechar',
          { duration: 5000 }
        );
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
