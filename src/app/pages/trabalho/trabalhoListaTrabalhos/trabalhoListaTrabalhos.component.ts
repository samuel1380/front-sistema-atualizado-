import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarTrabalhos, ocultarTrabalhoConcluido } from '../../../../services/trabalho.service';
import { TrabalhoElement } from '../trabalho/trabalho.component';

@Component({
  selector: 'app-trabalho-lista-trabalho',
  templateUrl: './trabalhoListaTrabalhos.component.html',
  styleUrl: './trabalhoListaTrabalhos.component.scss'
})
export class TrabalhoListaTrabalhosComponent implements OnInit, OnChanges {
  @Input() statusTrabalho: any;
  @Input() incluirOcultos: boolean = false;
  @Output() totalTrabalhos = new EventEmitter<number>();

  carregando: boolean = true;
  nomeLista = '';
  listaTrabalhos = new MatTableDataSource<TrabalhoElement>([]);
  displayedColumns: string[] = [ 'idTrabalho', 'nomeClinica', 'componentes', 'cor', 'nomePaciente', 'dataInclusao', 'dataHoraEnvio', 'status' ];

  get ehListaConcluidos(): boolean {
    if (!this.statusTrabalho) return false;
    return this.statusTrabalho.some((s: string) =>
      ['ENVIADO', 'ENVIADO_PROVA', 'PAGAMENTO_RECEBIDO'].includes(s)
    );
  }

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  getStatusLabel(status: string): string {
    if (!status) return '';
    const map: { [key: string]: string } = {
      'PENDENTE': 'Pendente',
      'ENVIADO_PROVA': 'Enviado Prova',
      'MODELAGEM': 'Modelagem',
      'IMPRESSAO_PROVA': 'Impressão Prova',
      'IMPRESSAO_CARGA_CERAMICA': 'Impressão Carga Cerâmica',
      'IMPRESSAO_BIOSPLINT_PLACA': 'Impressão BioSplint / Placa',
      'FRESAGEM': 'Fresagem',
      'SINTERIZACAO': 'Sinterização',
      'MAQUIAGEM': 'Maquiagem',
      'AGUARDANDO_COMPONENTE': 'Aguardando Componente',
      'PACOTE': 'Pacote',
      'AGUARDANDO_COLETA': 'Aguardando Coleta',
      'ENVIADO': 'Enviado',
      'PAGAMENTO_RECEBIDO': 'Pagamento Recebido',
      'CANCELADO': 'Cancelado'
    };
    return map[status] || status.replace(/_/g, ' ');
  }

  ngOnInit(): void {
    this.atualizarColunas();
    this.carregarTrabalhos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incluirOcultos'] && !changes['incluirOcultos'].firstChange) {
      this.carregarTrabalhos();
    }
  }

  atualizarColunas() {
    if (this.ehListaConcluidos) {
      this.displayedColumns = [ 'idTrabalho', 'nomeClinica', 'componentes', 'cor', 'nomePaciente', 'dataInclusao', 'dataHoraEnvio', 'status', 'acoes' ];
    } else {
      this.displayedColumns = [ 'idTrabalho', 'nomeClinica', 'componentes', 'cor', 'nomePaciente', 'dataInclusao', 'dataHoraEnvio', 'status' ];
    }
  }

  carregarTrabalhos() {
    if (this.statusTrabalho) {
      this.carregando = true;
      this.nomeLista = this.statusTrabalho?.join(", ");
      buscarTrabalhos(this.statusTrabalho, this.incluirOcultos).then((response: any) => {
        const dados = response.data || [];
        this.listaTrabalhos.data = dados;
        this.totalTrabalhos.emit(dados.length);
        this.carregando = false;
      }).catch(err => {
        console.error('Erro ao buscar trabalhos:', err);
        this.totalTrabalhos.emit(0);
        this.carregando = false;
      });
    }
  }

  abrirDetalhesTrabalho(trabalho: any) {
    if (trabalho?.idPaciente) {
      this.router.navigate([`/l/paciente/edit/${trabalho.idPaciente}`]);
    } else if (trabalho?.idTrabalho) {
      this.router.navigate([`/l/trabalho/edit/${trabalho.idTrabalho}`]);
    }
  }

  async alternarOcultar(element: any, event: MouseEvent) {
    event.stopPropagation();

    const estaOculto = !!element.ocultoConcluido;
    const confirmMsg = estaOculto 
      ? `Deseja restaurar o trabalho #${element.idTrabalho} para a visualização de Concluídos?`
      : `Deseja tirar o trabalho #${element.idTrabalho} da página de Concluídos?\n\n(O trabalho NÃO será apagado do sistema e todo o seu histórico continuará intacto!)`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      await ocultarTrabalhoConcluido(element.idTrabalho, !estaOculto);
      element.ocultoConcluido = !estaOculto;

      if (!this.incluirOcultos && !estaOculto) {
        this.listaTrabalhos.data = this.listaTrabalhos.data.filter((t: any) => t.idTrabalho !== element.idTrabalho);
        this.totalTrabalhos.emit(this.listaTrabalhos.data.length);
      }

      this.snackBar.open(
        estaOculto ? 'Trabalho restaurado com sucesso!' : 'Trabalho removido da página de Concluídos!',
        'Fechar',
        { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top' }
      );
    } catch (error) {
      console.error('Erro ao alternar status de exibição do trabalho:', error);
      this.snackBar.open('Erro ao atualizar trabalho. Tente novamente.', 'Fechar', { duration: 3000 });
    }
  }

  getComponentes(element: any) {
    const componentesTrabalho: any[] = element.componentes;
    if (element.status !== 'FRESAGEM' && element.status !== 'AGUARDANDO_COMPONENTE') {
      return '-';
    }
    if (!componentesTrabalho?.length) {
      return '-';
    }
    return componentesTrabalho
      .map((ct: any) => {
        const id = ct?.componente?.idComponente ?? ct?.idComponente;
        const nomeRaw = ct?.componente?.nome ?? ct?.nome;
        const idNum = id != null && id !== '' ? Number(id) : NaN;
        const idOk = !Number.isNaN(idNum) && idNum > 0;
        if (!idOk) {
          return 'Indefinido';
        }
        const nome = nomeRaw != null ? String(nomeRaw).trim() : '';
        if (!nome || nome.toLowerCase() === 'indefinido') {
          return 'Indefinido';
        }
        return nome;
      })
      .join(', ');
  }

  getCor(element: any) {
    const cor: any[] = element.cor;
    if (element.status == 'FRESAGEM' || element.status == 'AGUARDANDO_COMPONENTE' )
      return cor;

    return '-';
  }
}
