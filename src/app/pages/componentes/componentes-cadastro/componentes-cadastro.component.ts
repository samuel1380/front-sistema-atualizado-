import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogCadastroComponent } from 'src/app/components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { cadastrarComponente } from 'src/services/componente.service';
import { buscarMarcas } from 'src/services/marca.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { ErrorStateMatcher } from '@angular/material/core';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-componentes-cadastro',
  templateUrl: './componentes-cadastro.component.html',
  styleUrls: ['./componentes-cadastro.component.sass']
})
export class ComponentesCadastroComponent implements OnInit, OnChanges {
  marcaList: any = [];
  @Input() componente: any;
  @Output() onSave = new EventEmitter<any>();

  matcher = new MyErrorStateMatcher();

  marcaComponenteFormControl = new FormControl<number | ''>('', [Validators.required]);
  nomeFormControl = new FormControl('', [Validators.required]);
  precoControl = new FormControl('', [Validators.required]);
  hasParafusoFormControl = new FormControl(false, [Validators.required]);

  constructor(private router: Router, private dialog: MatDialog, public themeService: CustomizerSettingsService) {
    this.carregarMarcas();
  }

  ngOnInit() {
    this.preencherFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componente'] && this.componente) {
      this.preencherFormulario();
    }
  }

  private carregarMarcas() {
    buscarMarcas().then((response: any) => {
      if (response && response.status === 200 && Array.isArray(response.data)) {
        this.marcaList = response.data;
        // Se o componente já estava carregado, garante que o select reflita a marca
        if (this.componente?.idMarcaComponente) {
          this.marcaComponenteFormControl.setValue(Number(this.componente.idMarcaComponente));
        }
      }
    }).catch(err => {
      console.error('Erro ao carregar marcas:', err);
    });
  }

  private preencherFormulario() {
    if (!this.componente) return;
    this.nomeFormControl.setValue(this.componente.nome || '');
    if (this.componente.idMarcaComponente) {
      this.marcaComponenteFormControl.setValue(Number(this.componente.idMarcaComponente));
    }
    this.precoControl.setValue(this.componente.preco !== undefined ? String(this.componente.preco) : '');
    this.hasParafusoFormControl.setValue(!!this.componente.hasParafuso);
  }

  toggleTheme() {
      this.themeService.toggleTheme();
  }

  toggleCardBorderTheme() {
      this.themeService.toggleCardBorderTheme();
  }

  toggleCardBorderRadiusTheme() {
      this.themeService.toggleCardBorderRadiusTheme();
  }

  toggleRTLEnabledTheme() {
      this.themeService.toggleRTLEnabledTheme();
  }

  private parsePreco(valor: any): number {
    if (typeof valor === 'number') return Math.round(valor * 100) / 100;
    if (!valor) return 0;
    const str = valor.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    const precoNumero = this.parsePreco(this.precoControl.value);
    const idMarcaNumero = Number(this.marcaComponenteFormControl.value);

    const cadastroComponentePayload = {
      idMarcaComponente: idMarcaNumero,
      nome: (this.nomeFormControl.value || '').trim(),
      preco: precoNumero,
      hasParafuso: !!this.hasParafusoFormControl.value
    };

    try {
      if (!this.componente) {
        const result = await cadastrarComponente(cadastroComponentePayload);
        if (result?.status === 201 || result?.status === 200) {
          this.dialog.open(DialogCadastroComponent, {
            width: '50%',
            enterAnimationDuration: `100ms`,
            exitAnimationDuration: `100ms`,
          });
          this.router.navigate(['/l/componente']);
        }
      } else {
        this.onSave.emit(cadastroComponentePayload);
      }
    } catch (e) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

  private validaCadastro(): boolean {
    const nomeComponente = (this.nomeFormControl.value || '').trim();
    const idMarca = Number(this.marcaComponenteFormControl.value);
    const precoVal = this.precoControl.value;

    let hasError = false;

    if (!nomeComponente) {
      this.nomeFormControl.markAsTouched();
      this.nomeFormControl.setErrors({ required: true });
      hasError = true;
    }

    if (!idMarca || isNaN(idMarca) || idMarca <= 0) {
      this.marcaComponenteFormControl.markAsTouched();
      this.marcaComponenteFormControl.setErrors({ required: true });
      hasError = true;
    }

    if (precoVal === null || precoVal === undefined || precoVal === '' || isNaN(this.parsePreco(precoVal))) {
      this.precoControl.markAsTouched();
      this.precoControl.setErrors({ required: true });
      hasError = true;
    }

    return hasError;
  }
}


// Cadastro de Cores e Validação da edição de componentes.
