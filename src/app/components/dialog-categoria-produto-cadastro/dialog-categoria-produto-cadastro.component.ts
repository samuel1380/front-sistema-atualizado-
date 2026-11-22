import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { cadastrarCategoria } from '../../../services/categoriaproduto.service';

@Component({
  selector: 'app-dialog-categoria-produto-cadastro',
  templateUrl: './dialog-categoria-produto-cadastro.component.html',
  styleUrls: ['./dialog-categoria-produto-cadastro.component.sass']
})
export class DialogCategoriaProdutoCadastroComponent {
  nomeCategoria: string = '';
  salvando: boolean = false;
  erroMensagem: string = '';

  constructor(public dialogRef: MatDialogRef<DialogCategoriaProdutoCadastroComponent>) {}

  async salvar() {
    const nome = this.nomeCategoria?.trim();
    if (!nome) {
      this.erroMensagem = 'Informe o nome da categoria.';
      return;
    }

    this.salvando = true;
    this.erroMensagem = '';
    try {
      const res = await cadastrarCategoria({ nome, ativo: true });
      if (res && (res.status === 200 || res.status === 201)) {
        this.dialogRef.close({
          idCategoriaProduto: res.data?.idCategoriaProduto,
          nome: res.data?.nome || nome
        });
      } else {
        this.erroMensagem = 'Erro ao salvar categoria. Tente novamente.';
      }
    } catch (err: any) {
      console.error('Erro ao salvar categoria no modal:', err);
      const msg = err?.response?.data?.message;
      this.erroMensagem = Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : err?.message || 'Erro ao salvar categoria.');
    } finally {
      this.salvando = false;
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}
