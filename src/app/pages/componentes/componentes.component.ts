import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarComponentes } from 'src/services/componente.service';

@Component({
  selector: 'app-componentes',
  templateUrl: './componentes.component.html',
  styleUrls: ['./componentes.component.sass']
})
export class ComponentesComponent implements OnInit {
  listaComponentes = new MatTableDataSource<any>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "marcaNome", titulo: "Marca" },
    { coluna: "preco", titulo: "Preço", price: 'BRL' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarComponentes();
  }

  carregarComponentes(): void {
    buscarComponentes().then((response: any) => {
      if (response && response.data && Array.isArray(response.data)) {
        response.data.forEach((componente: any) => {
          componente.marcaNome = componente.marca?.nome || 'Sem Marca';
        });

        this.listaComponentes.data = response.data;
      }
    }).catch(err => {
      console.error('Erro ao buscar componentes:', err);
    });
  }

  abrirCadastro() {
    this.router.navigate([`/l/componente/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    if (event?.idComponente) {
      this.router.navigate([`/l/componente/edit/${event.idComponente}`]);
    }
  }
}
