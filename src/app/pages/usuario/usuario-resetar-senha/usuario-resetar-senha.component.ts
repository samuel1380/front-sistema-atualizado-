import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService, Usuario } from 'src/services/usuario.service';

@Component({
  selector: 'app-usuario-resetar-senha',
  templateUrl: './usuario-resetar-senha.component.html',
  styleUrls: ['./usuario-resetar-senha.component.sass']
})
export class UsuarioResetarSenhaComponent {
  usuario: Usuario;
  modo: 'manual' | 'automatica' = 'manual';
  senhaForm: FormGroup;
  hideNova = true;
  hideConfirmar = true;
  loading = false;
  sucesso = false;
  senhaDefinida = '';

  constructor(
    public dialogRef: MatDialogRef<UsuarioResetarSenhaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Usuario,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar
  ) {
    this.usuario = data;
    this.senhaForm = new FormGroup({
      novaSenha: new FormControl('', [Validators.required, Validators.minLength(4)]),
      confirmarSenha: new FormControl('', [Validators.required])
    }, { validators: this.senhasIguaisValidator });
  }

  senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
    const nova = group.get('novaSenha')?.value;
    const confirma = group.get('confirmarSenha')?.value;
    return nova === confirma ? null : { senhasDiferentes: true };
  }

  gerarSugestao() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.senhaForm.patchValue({
      novaSenha: pass,
      confirmarSenha: pass
    });
    this.hideNova = false;
    this.hideConfirmar = false;
  }

  copiarSenha() {
    if (!this.senhaDefinida) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.senhaDefinida).then(() => {
        this.snackBar.open('Senha copiada com sucesso!', 'Fechar', { duration: 2500 });
      }).catch(() => {
        prompt('Copie a senha:', this.senhaDefinida);
      });
    } else {
      prompt('Copie a senha:', this.senhaDefinida);
    }
  }

  salvar() {
    let senhaParaEnviar: string | undefined = undefined;

    if (this.modo === 'manual') {
      if (this.senhaForm.invalid) {
        this.snackBar.open('Preencha os campos de senha corretamente.', 'Fechar', { duration: 3000 });
        return;
      }
      senhaParaEnviar = this.senhaForm.value.novaSenha;
    }

    this.loading = true;
    this.usuarioService.resetarSenha(this.usuario.idUsuario, senhaParaEnviar).subscribe({
      next: (res) => {
        this.loading = false;
        this.sucesso = true;
        this.senhaDefinida = res.senhaGerada;
        this.snackBar.open('Senha atualizada com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (err) => {
        this.loading = false;
        console.error('Erro ao definir senha', err);
        const msg = err?.error?.message || 'Erro ao definir senha do usuário.';
        this.snackBar.open(msg, 'Fechar', { duration: 4000 });
      }
    });
  }

  cancelar() {
    this.dialogRef.close(this.sucesso);
  }
}
