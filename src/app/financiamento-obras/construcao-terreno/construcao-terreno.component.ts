import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FinanciamentoObrasService } from '../financiamento-obras.service';

@Component({
  selector: 'app-construcao-terreno',
  templateUrl: './construcao-terreno.component.html',
  styleUrls: ['./construcao-terreno.component.css'],
  providers: [CurrencyPipe]
})
export class ConstrucaoTerrenoComponent implements OnInit {
  financiamentoForm!: FormGroup;
  resultadoCalculo: any;
  mostrarPlanilha = false; // controla exibição da planilha

  constructor(
    private fb: FormBuilder,
    private currencyPipe: CurrencyPipe,
    private financiamentoService: FinanciamentoObrasService
  ) {}

  ngOnInit(): void {
    this.financiamentoForm = this.fb.group({
      valorObra: [null, [Validators.required, Validators.min(1000)]],
      prazoObra: [null, [Validators.required, Validators.min(4), Validators.max(12)]],
      percentualExecutado: [0, [Validators.min(0), Validators.max(100)]],
      prazoTotal: [null, [Validators.required, Validators.min(88), Validators.max(132)]],
      sistema: ['PRICE', Validators.required]
    });
  }

  get prazoAmortizacao(): number {
    const prazoObra = this.financiamentoForm.get('prazoObra')?.value || 0;
    const prazoTotal = this.financiamentoForm.get('prazoTotal')?.value || 0;
    return prazoTotal > 0 ? prazoTotal - prazoObra : 0;
  }

  formatarMoeda(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, '');
    if (valor) {
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      const valorFormatado = this.currencyPipe.transform(valor, 'BRL', 'symbol', '1.2-2');
      event.target.value = valorFormatado ?? '';
      this.financiamentoForm.get('valorObra')?.setValue(Number(valor));
    } else {
      this.financiamentoForm.get('valorObra')?.setValue(null);
    }
  }

  onSubmit(): void {
    if (this.financiamentoForm.valid) {
      const dados = this.financiamentoForm.value;
      this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
        dados.valorObra,
        dados.prazoObra,
        dados.percentualExecutado,
        dados.prazoTotal,
        dados.sistema
      );
      this.mostrarPlanilha = false; // reseta a planilha ao recalcular
    }
  }
}
