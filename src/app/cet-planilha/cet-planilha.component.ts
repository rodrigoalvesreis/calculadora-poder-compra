import { Component, Input } from '@angular/core';

export interface Parcela {
  mes: number;
  valorLiberado?: number;
  valorLiberadoAcumulado?: number;
  valorParcela: number;
  valorAmortizacao: number;
}

export interface DadosCET {
  faseObras: Parcela[];
  faseAmortizacao: Parcela[];
  custoTotalObra: number;
  custoTotalAmortizacao: number;
  cetEfetivo: number;
  taxaJuros: number;
}

@Component({
  selector: 'app-cet-planilha',
  templateUrl: './cet-planilha.component.html',
  styleUrls: ['./cet-planilha.component.css']
})
export class CetPlanilhaComponent {
  @Input() dadosCET!: DadosCET;
}
