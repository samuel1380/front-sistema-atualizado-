import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface StatusItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-trabalho',
  templateUrl: './trabalho.component.html',
  styleUrl: './trabalho.component.sass'
})
export class TrabalhoComponent implements OnInit {

  statuses: StatusItem[] = [
    { key: 'PENDENTE', label: 'Pendente' },
    { key: 'ENVIADO_PROVA', label: 'Enviado Prova' },
    { key: 'MODELAGEM', label: 'Modelagem' },
    { key: 'IMPRESSAO_PROVA', label: 'Imp. Prova' },
    { key: 'IMPRESSAO_CARGA_CERAMICA', label: 'Carga Cerâmica' },
    { key: 'IMPRESSAO_BIOSPLINT_PLACA', label: 'BioSplint / Placa' },
    { key: 'FRESAGEM', label: 'Fresagem' },
    { key: 'SINTERIZACAO', label: 'Sinterização' },
    { key: 'MAQUIAGEM', label: 'Maquiagem' },
    { key: 'AGUARDANDO_COMPONENTE', label: 'Aguard. Comp.' },
    { key: 'PACOTE', label: 'Pacote' },
    { key: 'AGUARDANDO_COLETA', label: 'Aguard. Coleta' },
  ];

  statusCounts: { [key: string]: number } = {};
  selectedStatus: string = 'COM_TRABALHO';
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
    if (this.selectedStatus === 'TODOS') {
      return true;
    }
    if (this.selectedStatus === 'COM_TRABALHO') {
      const count = this.statusCounts[statusKey];
      return count === undefined || count > 0;
    }
    return this.selectedStatus === statusKey;
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
