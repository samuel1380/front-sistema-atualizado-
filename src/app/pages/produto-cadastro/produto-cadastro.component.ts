import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { buscarCategorias, cadastrarCategoria } from '../../../services/categoriaproduto.service';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { cadastrarProduto } from 'src/services/produto.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { DialogCategoriaProdutoCadastroComponent } from 'src/app/components/dialog-categoria-produto-cadastro/dialog-categoria-produto-cadastro.component';
import { CustomizerSettingsService } from '../externalComponents/customizer-settings/customizer-settings.service';
import { buscarMarcas } from 'src/services/marca.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-produto-cadastro',
  templateUrl: './produto-cadastro.component.html',
  styleUrls: ['./produto-cadastro.component.sass']
})
export class ProdutoCadastroComponent implements OnInit {
  nomeProdutoControl = new FormControl('', [Validators.required]);
  precoControl = new FormControl('', [Validators.required]);
  categoriaProdutoFormControl = new FormControl<number | ''>('', [Validators.required]);

  // Categoria dinâmica
  novaCategoriaControl = new FormControl('', [Validators.required]);
  showNovaCategoriaInput: boolean = false;
  salvandoCategoria: boolean = false;
  mensagemSucessoCategoria: string = '';
  mensagemErroCategoria: string = '';
  categoriaAnterior: number | '' = '';

  categoriaList: any = [];
  marcaList: any = [];
  marcasProduto: any = [];

  matcher = new MyErrorStateMatcher();

  ativo: boolean = true;

  @Input() produto: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {
    this.carregarCategorias();

    buscarMarcas().then((response: any) => {
      if (response && response.status === 200) {
        this.marcaList = response.data;
      }
    }).catch(err => console.error('Erro ao buscar marcas', err));
  }

  async carregarCategorias() {
    try {
      const response: any = await buscarCategorias();
      if (response && (response.status === 200 || response.status === 201)) {
        this.categoriaList = (response.data || []).sort((a: any, b: any) =>
          (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
        );
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      this.categoriaList = [];
    }
  }

  ngOnInit() {
    if (this.produto) {
      this.nomeProdutoControl.setValue(this.produto.nome);
      this.precoControl.setValue(this.produto.preco != null ? String(this.produto.preco) : '');
      if (this.produto.idCategoriaProduto) {
        const idCat = Number(this.produto.idCategoriaProduto);
        this.categoriaProdutoFormControl.setValue(idCat);
        this.categoriaAnterior = idCat;
      }
    }
  }

  onCategoriaChange(event: any) {
    if (event?.value === '__NOVA_CATEGORIA__') {
      // Reverte para o valor anterior e abre o diálogo de criação
      this.categoriaProdutoFormControl.setValue(this.categoriaAnterior || '');
      this.abrirDialogNovaCategoria();
    } else {
      this.categoriaAnterior = event?.value ?? '';
    }
  }

  private normalizarTexto(txt: string): string {
    return (txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  abrirDialogNovaCategoria(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dialogRef = this.dialog.open(DialogCategoriaProdutoCadastroComponent, {
      width: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms'
    });

    dialogRef.afterClosed().subscribe(async (resultado) => {
      if (resultado && (resultado.idCategoriaProduto || resultado.nome)) {
        await this.carregarCategorias();
        const idNova = resultado.idCategoriaProduto ? Number(resultado.idCategoriaProduto) : null;
        const nomeNova = resultado.nome || '';
        let recemCriada = this.categoriaList.find(
          (c: any) => (idNova && Number(c.idCategoriaProduto) === idNova) ||
                      (c.nome && this.normalizarTexto(c.nome) === this.normalizarTexto(nomeNova))
        );
        if (recemCriada) {
          const idFinal = Number(recemCriada.idCategoriaProduto);
          this.categoriaProdutoFormControl.setValue(idFinal);
          this.categoriaAnterior = idFinal;
        } else if (idNova) {
          recemCriada = { idCategoriaProduto: idNova, nome: nomeNova, ativo: true };
          this.categoriaList.push(recemCriada);
          this.categoriaList.sort((a: any, b: any) =>
            (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
          );
          this.categoriaProdutoFormControl.setValue(idNova);
          this.categoriaAnterior = idNova;
        }
        this.categoriaProdutoFormControl.markAsDirty();
        this.categoriaProdutoFormControl.updateValueAndValidity();
      }
    });
  }

  abrirNovaCategoria(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showNovaCategoriaInput = true;
    this.mensagemSucessoCategoria = '';
    this.mensagemErroCategoria = '';
    this.novaCategoriaControl.reset();
  }

  cancelarNovaCategoria() {
    this.showNovaCategoriaInput = false;
    this.mensagemSucessoCategoria = '';
    this.mensagemErroCategoria = '';
    this.novaCategoriaControl.reset();
  }

  async salvarNovaCategoria() {
    const nome = this.novaCategoriaControl.value?.trim();
    if (!nome) {
      this.novaCategoriaControl.markAsTouched();
      this.mensagemErroCategoria = 'Informe o nome da categoria.';
      return;
    }

    this.salvandoCategoria = true;
    this.mensagemSucessoCategoria = '';
    this.mensagemErroCategoria = '';

    // Se já existir uma categoria ativa com o mesmo nome (insensível a acentos e maiúsculas), seleciona diretamente
    const categoriaExistente = this.categoriaList.find(
      (c: any) => this.normalizarTexto(c.nome) === this.normalizarTexto(nome)
    );
    if (categoriaExistente) {
      const idCat = Number(categoriaExistente.idCategoriaProduto);
      this.categoriaProdutoFormControl.setValue(idCat);
      this.categoriaAnterior = idCat;
      this.categoriaProdutoFormControl.markAsDirty();
      this.categoriaProdutoFormControl.updateValueAndValidity();
      this.mensagemSucessoCategoria = `Categoria "${categoriaExistente.nome}" selecionada!`;
      this.salvandoCategoria = false;
      setTimeout(() => {
        this.showNovaCategoriaInput = false;
        this.mensagemSucessoCategoria = '';
        this.novaCategoriaControl.reset();
      }, 1200);
      return;
    }

    try {
      const res = await cadastrarCategoria({ nome, ativo: true });
      if (res && (res.status === 200 || res.status === 201)) {
        await this.carregarCategorias();
        const idNova = res.data?.idCategoriaProduto ? Number(res.data.idCategoriaProduto) : null;
        const nomeRetornado = res.data?.nome || nome;
        let recemCriada = this.categoriaList.find(
          (c: any) => (idNova && Number(c.idCategoriaProduto) === idNova) ||
                      (c.nome && this.normalizarTexto(c.nome) === this.normalizarTexto(nome))
        );
        if (recemCriada) {
          const idFinal = Number(recemCriada.idCategoriaProduto);
          this.categoriaProdutoFormControl.setValue(idFinal);
          this.categoriaAnterior = idFinal;
        } else if (idNova) {
          recemCriada = { idCategoriaProduto: idNova, nome: nomeRetornado, ativo: true };
          this.categoriaList.push(recemCriada);
          this.categoriaList.sort((a: any, b: any) =>
            (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
          );
          this.categoriaProdutoFormControl.setValue(idNova);
          this.categoriaAnterior = idNova;
        }
        this.categoriaProdutoFormControl.markAsDirty();
        this.categoriaProdutoFormControl.updateValueAndValidity();
        this.mensagemSucessoCategoria = `Categoria "${recemCriada?.nome || nomeRetornado}" salva e selecionada!`;
        this.novaCategoriaControl.reset();
        setTimeout(() => {
          this.showNovaCategoriaInput = false;
          this.mensagemSucessoCategoria = '';
        }, 1500);
      } else {
        this.mensagemErroCategoria = 'Não foi possível cadastrar a categoria. Tente novamente.';
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar categoria', err);
      const msg = err?.response?.data?.message;
      this.mensagemErroCategoria = Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : err?.message || 'Erro ao cadastrar categoria.');
    } finally {
      this.salvandoCategoria = false;
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    const precoBruto = this.precoControl?.value ?? "0";
    const precoClean = typeof precoBruto === 'number'
      ? precoBruto
      : parseFloat(String(precoBruto).replace(/\./g, '').replace(',', '.')) || 0;

    let produtoPayload = {
      idProduto: this.produto?.idProduto,
      nome: (this.nomeProdutoControl.value || '').trim(),
      prazoEntregaDias: 5,
      precoCusto: 0.0,
      preco: Math.round(precoClean * 100) / 100,
      idCategoriaProduto: Number(this.categoriaProdutoFormControl.value),
      ativo: true,
      customProduto: this.marcasProduto || []
    };

    try {
      let result;
      if (!this.produto) {
        result = await cadastrarProduto(produtoPayload);
      } else {
        this.onSave.emit(produtoPayload);
        return;
      }

      if (result && (result.status === 200 || result.status === 201)) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/produto']);
        return;
      } else {
        this.dialog.open(DialogCadastroErroComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
      }
    } catch (e) {
      console.error('Erro no cadastro do produto:', e);
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
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

  private validaCadastro(): boolean {
    const nome = this.nomeProdutoControl.value?.trim();
    const preco = this.precoControl.value;
    const tipoProduto = this.categoriaProdutoFormControl.value;

    let invalido = false;

    if (!nome) {
      this.nomeProdutoControl.markAllAsTouched();
      invalido = true;
    }
    if (preco === null || preco === undefined || String(preco).trim() === '') {
      this.precoControl.markAllAsTouched();
      invalido = true;
    }
    if (!tipoProduto) {
      this.categoriaProdutoFormControl.markAllAsTouched();
      invalido = true;
    }

    return invalido;
  }

  hasActiveMarca(idMarca: number) {
    return this.produto?.customProduto?.some((custom: any) => {
      return parseInt(custom.customValue) == idMarca;
    });
  }

  async setMarcas(checked: boolean, idMarca: number) {
    if (checked) {
      this.marcasProduto.push({ customName: "marcasProdutos", customValue: idMarca, idProduto: this.produto?.idProduto });
    } else {
      const index = this.marcasProduto.map((marca: any) => marca.customValue).indexOf(idMarca);
      if (index >= 0) {
        this.marcasProduto.splice(index, 1);
      }
    }
  }
}
