import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface StatusItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-trabalho-concluido',
  templateUrl: './trabalhoConcluido.component.html',
  styleUrl: './trabalhoConcluido.component.sass'
})
export class TrabalhoConcluidoComponent implements OnInit {
  mostrarOcultos: boolean = false;

  statuses: StatusItem[] = [
    { key: 'ENVIADO', label: 'Enviado' },
    { key: 'ENVIADO_PROVA', label: 'Enviado Prova' },
    { key: 'PAGAMENTO_RECEBIDO', label: 'Pagamento Recebido' },
  ];

  statusCounts: { [key: string]: number } = {};
  selectedStatus: string = 'TODOS';
  isMobile: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
      this.selectedStatus = this.isMobile ? 'COM_TRABALHO' : 'TODOS';
    }
  }

  onTotalTrabalhos(statusKey: string, total: number) {
    this.statusCounts[statusKey] = total;
  }

  get totalGeral(): number {
    return Object.values(this.statusCounts).reduce((acc, curr) => acc + curr, 0);
  }

  get totalStatusComTrabalhos(): number {
    return Object.values(this.statusCounts).filter(v => v > 0).length;
  }

  selecionarStatus(status: string) {
    this.selectedStatus = status;
  }

  deveExibirStatus(statusKey: string): boolean {
    if (this.selectedStatus === 'TODOS') return true;
    if (this.selectedStatus === 'COM_TRABALHO') {
      const count = this.statusCounts[statusKey];
      return count === undefined || count > 0;
    }
    return this.selectedStatus === statusKey;
  }

  toggleMostrarOcultos() {
    this.mostrarOcultos = !this.mostrarOcultos;
  }

  criarTrabalho() {
    this.router.navigate([`/l/trabalho/cadastro`]);
  }
}

export interface TrabalhoElement {
  position?: string;
  idTrabalho: number;
  customer?: string;
  dataInclusao?: string;
  status: string;
  empresa?: any;
  nomePaciente?: string;
  dataHoraEnvio?: string;
  dataConclusao?: string;
  ocultoConcluido?: boolean;
  componentes?: any[];
  cor?: any;
  idPaciente?: number;
  [key: string]: any;
}
