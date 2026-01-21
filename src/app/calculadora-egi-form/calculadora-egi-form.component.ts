import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EgiCalculatorService, ResultadoCalculo } from '../services/calculadora-egi.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-calculadora-egi-form',
  templateUrl: './calculadora-egi-form.component.html',
  styleUrls: ['./calculadora-egi-form.component.css']
})
export class CalculadoraEgiFormComponent implements OnInit {
  form!: FormGroup;
  resultado?: ResultadoCalculo;

  liquidacaoSimultanea = false;

  valorMinimoLiquidacao = environment.egiConfig.cenarios.liquidacao.valorMinimoCredito;

  constructor(
    private egiService: EgiCalculatorService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      valorImovel: [null, [Validators.required, Validators.min(84000)]],
      valorRenda: [null, [Validators.required, Validators.min(100)]],
      saldoDevedor: [null, [Validators.min(0)]],
    });
  }

  permiteLiquidacaoSimultanea() {
    let valorFInanciavel = this.resultado?.valorMaximoFinanciavel ?? 0;

    return valorFInanciavel > this.valorMinimoLiquidacao;
  }

  calcular(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { valorImovel, valorRenda, saldoDevedor } = this.form.value;

    this.resultado = this.egiService.calcular(
      valorImovel,
      saldoDevedor,
      valorRenda,
      this.liquidacaoSimultanea
    );
  }
}