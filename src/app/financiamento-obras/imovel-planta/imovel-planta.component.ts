import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FinanciamentoObrasService } from '../financiamento-obras.service';

@Component({
  selector: 'app-imovel-planta',
  templateUrl: './imovel-planta.component.html',
  styleUrls: ['./imovel-planta.component.css'],
  providers: [CurrencyPipe]
})
export class ImovelPlantaComponent implements OnInit {
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
      valorImovel: [null, [Validators.required, Validators.min(1000)]],
      prazoObra: [null, [Validators.required, Validators.min(4), Validators.max(36)]],
      percentualExecutado: [0, [Validators.min(0), Validators.max(100)]],
      prazoFinanciamento: [null, [Validators.required, Validators.min(84), Validators.max(420)]],
      sistema: ['PRICE', Validators.required]
    });
  }

  get prazoAmortizacao(): number {
    const prazoObra = this.financiamentoForm.get('prazoObra')?.value || 0;
    const prazoFinanciamento = this.financiamentoForm.get('prazoFinanciamento')?.value || 0;
    return prazoFinanciamento > 0 ? prazoFinanciamento - prazoObra : 0;
  }

  formatarMoeda(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, '');
    if (valor) {
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      const valorFormatado = this.currencyPipe.transform(valor, 'BRL', 'symbol', '1.2-2');
      event.target.value = valorFormatado ?? '';
      this.financiamentoForm.get('valorImovel')?.setValue(Number(valor));
    } else {
      this.financiamentoForm.get('valorImovel')?.setValue(null);
    }
  }

  onSubmit(): void {
    if (this.financiamentoForm.valid) {
      const dados = this.financiamentoForm.value;
      this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
        0,
        dados.valorImovel,
        dados.prazoObra,
        dados.percentualExecutado,
        dados.prazoFinanciamento,
        dados.sistema
      );
      this.mostrarPlanilha = false; // reseta a planilha ao recalcular
    }
  }
}
