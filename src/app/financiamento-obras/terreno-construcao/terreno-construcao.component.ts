import { CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanciamentoObrasService } from '../financiamento-obras.service';

@Component({
  selector: 'app-terreno-construcao',
  templateUrl: './terreno-construcao.component.html',
  styleUrls: ['./terreno-construcao.component.css'],
  providers: [CurrencyPipe]
})
export class TerrenoConstrucaoComponent implements OnInit {
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
      valorTerreno: [null, [Validators.required, Validators.min(1000)]],
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
      this.financiamentoForm.get(event.target.id)?.setValue(Number(valor));
    } else {
      this.financiamentoForm.get(event.target.id)?.setValue(null);
    }
  }

  onSubmit(): void {

    console.log('aqui', this.financiamentoForm.valid)
    if (this.financiamentoForm.valid) {
      const dados = this.financiamentoForm.value;
      this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
        dados.valorObra + dados.valorTerreno,
        dados.prazoObra,
        dados.percentualExecutado,
        dados.prazoTotal,
        dados.sistema
      );
      this.mostrarPlanilha = false; // reseta a planilha ao recalcular
    }
  }
}
