import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-multiple-selection',
  templateUrl: './multiple-selection.component.html',
  styleUrl: './multiple-selection.component.sass'
})
export class MultipleSelectionComponent implements OnInit, OnChanges {

  separatorKeysCodes: number[] = [ENTER, COMMA];
  ItensCtrl = new FormControl('');
  filteredItens: Observable<any[]> | undefined;
  filteredItensArray: any[] = [];

  @Input() itensSelected!: FormArray;
  @Input() allItens: any[] = [];
  @Input() nomeIdentificador: string = '';
  @Input() renderName: string = '';
  @Input() unicItem: boolean = false;
  @Input() onlyList: boolean = false;
  @Input() allowCreateNew: boolean = false; // Permite criar itens novos quando não existem na lista
  @Input() titulo: string = 'Selecione';
  @Input() placeholder: string = 'Adicionar...';
  @Input() control!: FormControl;
  @Input() listSubscription: Observable<any[]> | undefined;

  @Output() onUpdateList = new EventEmitter<any>();

  @ViewChild('itemInput') itemInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild(MatAutocompleteTrigger) trigger?: MatAutocompleteTrigger;

  private isInternalUpdate: boolean = false; // Flag para evitar loops de atualização

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges) {
    if (!this.control) {
      return;
    }

    if (this.isInternalUpdate) {
      return;
    }

    if (changes['itensSelected']?.firstChange) {
      this.updateControlValue(false, false);
    }
  }

  async ngOnInit() {
    if (!this.listSubscription) return;
    this.listSubscription.subscribe(
      (itens: any[]) => {
        this.allItens = itens || [];

        this.filteredItens = this.ItensCtrl.valueChanges.pipe(
          startWith(null),
          map((item: any | null) => {
            const result = (item ? this._filter(item) : this.deduplicateItems(this.allItens));
            this.filteredItensArray = result;
            return result;
          }),
        );
      });

    this.updateControlValue(false, false);
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (this.onlyList) return;
    if (!value) return;

    if (this.allowCreateNew) {
      this.tryAddItem({
        [this.nomeIdentificador]: null,
        [this.renderName]: value
      });
    } else {
      if (this.unicItem && this.checkExistsItem(value)) return;
      if (value) {
        this.addList({ [this.renderName]: value });
      }
    }

    event.chipInput!.clear();
    this.ItensCtrl.setValue(null);
  }

  private tryAddItem(item: any): boolean {
    if (!item) return false;

    // Se unicItem está ativo, verifica duplicatas
    if (this.unicItem) {
      const jaExiste = this.checkItemExists(item);
      if (jaExiste) {
        return false;
      }
    }

    this.addList(item);
    return true;
  }

  private checkItemExists(item: any): boolean {
    const idNovo = item[this.nomeIdentificador];
    const nomeNovo = (item[this.renderName] || item.nome || '').toString().trim().toLowerCase();

    return this.itensSelected.controls.some(ctrl => {
      const idAtual = ctrl.get(this.nomeIdentificador)?.value;
      const nomeAtual = (ctrl.get(this.renderName)?.value || '').toString().trim().toLowerCase();

      // Se o nome/código for igual, já existe
      if (nomeAtual && nomeNovo && nomeAtual === nomeNovo) {
        return true;
      }

      // Ou se o ID for igual (e não nulo)
      if (idAtual !== undefined && idAtual !== null && idNovo !== undefined && idNovo !== null) {
        return idAtual === idNovo;
      }

      return false;
    });
  }

  addList(item: any) {
    this.isInternalUpdate = true;

    const groupNew = this.fb.group({
      [this.nomeIdentificador]: item[this.nomeIdentificador] || null,
      [this.renderName]: item[this.renderName] || ''
    });

    this.itensSelected.push(groupNew);
    this.updateControlValue(true, true);

    this.isInternalUpdate = false;
  }

  keyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    keyboardEvent.stopPropagation();

    const rawVal = (this.itemInput?.nativeElement?.value || this.ItensCtrl.value || '').toString().trim();
    if (!rawVal) return;

    // 1. Procura primeiro por correspondência EXATA (case-insensitive)
    const exactMatch = (this.filteredItensArray || []).find(item => {
      const val = (item[this.renderName] || item.nome || '').toString().trim().toLowerCase();
      return val === rawVal.toLowerCase();
    }) || (this.allItens || []).find(item => {
      const val = (item[this.renderName] || item.nome || '').toString().trim().toLowerCase();
      return val === rawVal.toLowerCase();
    });

    if (exactMatch) {
      this.tryAddItem({
        [this.nomeIdentificador]: exactMatch[this.nomeIdentificador],
        [this.renderName]: exactMatch[this.renderName] || exactMatch.nome
      });
    }
    // 2. Se houver opções filtradas no dropdown, seleciona a primeira
    else if (this.filteredItensArray && this.filteredItensArray.length > 0) {
      const item = this.filteredItensArray[0];
      this.tryAddItem({
        [this.nomeIdentificador]: item[this.nomeIdentificador],
        [this.renderName]: item[this.renderName] || item.nome
      });
    }
    // 3. Se allowCreateNew estiver ativo ou !onlyList, adiciona o que o usuário digitou
    else if (this.allowCreateNew || !this.onlyList) {
      this.tryAddItem({
        [this.nomeIdentificador]: null,
        [this.renderName]: rawVal
      });
    }

    // Limpa o campo de entrada e fecha o painel do autocomplete
    if (this.itemInput) {
      this.itemInput.nativeElement.value = '';
    }
    this.ItensCtrl.setValue(null);
    this.trigger?.closePanel();
  }

  remove(index: number) {
    this.isInternalUpdate = true;
    this.itensSelected.removeAt(index);
    this.updateControlValue(true, true);
    this.isInternalUpdate = false;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const itemId = event.option.value;
    const itemName = event.option.viewValue;

    this.tryAddItem({
      [this.nomeIdentificador]: itemId,
      [this.renderName]: itemName
    });

    if (this.itemInput) {
      this.itemInput.nativeElement.value = '';
    }
    this.ItensCtrl.setValue(null);
  }

  private _filter(value: string): any[] {
    if (typeof value !== 'string') return this.deduplicateItems(this.allItens);

    const filterValue = value.toLowerCase().trim();
    const filtered = (this.allItens || []).filter(item => {
      if (!item) return false;
      const name = (item[this.renderName] || item.nome || '').toString().toLowerCase();
      return name.includes(filterValue);
    });

    return this.deduplicateItems(filtered);
  }

  private deduplicateItems(items: any[]): any[] {
    if (!items || !Array.isArray(items)) return [];
    const seen = new Set<string>();
    return items.filter(item => {
      if (!item) return false;
      const key = (item[this.renderName] || item.nome || '').toString().trim().toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private checkExistsItem(value: string): boolean {
    return this.itensSelected.controls.some(item => item.value[this.renderName] == value);
  }

  private checkExistsItemById(id: any): boolean {
    if (id === undefined || id === null) return false;
    return this.itensSelected.controls.some(ctrl => {
      const idAtual = ctrl.get(this.nomeIdentificador)?.value;
      return idAtual === id;
    });
  }

  private updateControlValue(markAsTouched: boolean = true, emitEvent: boolean = true): void {
    if (!this.control) {
      return;
    }

    const selectedIds = this.itensSelected.controls
      .map(ctrl => ctrl.get(this.nomeIdentificador)?.value)
      .filter(id => id !== undefined && id !== null);

    const currentValue = this.control.value || [];
    const valuesEqual = Array.isArray(currentValue) &&
      currentValue.length === selectedIds.length &&
      currentValue.every((id: any, index: number) => id === selectedIds[index]);

    if (!valuesEqual) {
      this.control.setValue(selectedIds, { emitEvent });
    }

    if (markAsTouched) {
      this.control.markAsDirty();
      this.control.markAsTouched();
    }
  }
}
