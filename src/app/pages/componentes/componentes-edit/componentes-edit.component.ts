import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarComponente, buscarComponentePorId } from 'src/services/componente.service';

@Component({
  selector: 'app-componentes-edit',
  templateUrl: './componentes-edit.component.html',
  styleUrls: ['./componentes-edit.component.sass']
})
export class ComponentesEditComponent {
  idComponente: number = 0;
  componente: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {
    const idParam = this.activatedRoute.snapshot.paramMap.get("id");
    this.idComponente = idParam ? parseInt(idParam, 10) : 0;
    if (!this.idComponente) {
      this.router.navigate(['/l/componente']);
      return;
    }

    this.carregarComponente();
  }

  private carregarComponente() {
    buscarComponentePorId(this.idComponente).then((response: any) => {
      if (response && (response.status === 200 || response.status === 201)) {
        this.componente = response.data;
      }
    }).catch(err => {
      console.error('Erro ao buscar componente por ID:', err);
    });
  }

  async onSave(componentePayload: any) {
    try {
      const result = await alterarComponente(componentePayload, this.idComponente);

      if (result && (result.status === 200 || result.status === 201)) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/componente']);
        return;
      }
    }
    catch (e) {
      console.error('Erro ao alterar componente:', e);
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

}
