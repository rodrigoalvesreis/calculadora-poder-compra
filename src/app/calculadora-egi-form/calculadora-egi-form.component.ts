import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EgiCalculatorService, ResultadoCalculo } from '../services/calculadora-egi.service';

@Component({
  selector: 'app-calculadora-egi-form',
  templateUrl: './calculadora-egi-form.component.html',
  styleUrls: ['./calculadora-egi-form.component.css']
})
export class CalculadoraEgiFormComponent implements OnInit {
  form!: FormGroup;
  resultado?: ResultadoCalculo;

  liquidacaoSimultanea = false;

  constructor(
    private egiService: EgiCalculatorService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      valorImovel: [null, [Validators.required, Validators.min(1)]],
      valorRenda: [null, [Validators.required, Validators.min(1)]],
      saldoDevedor: [null, [Validators.min(0)]],
    });

    this.form.valueChanges.subscribe(() => {
      this.resultado = undefined;
      this.liquidacaoSimultanea = false;
    });
  }

  permiteLiquidacaoSimultanea() {
    const { valorImovel, saldoDevedor } = this.form.value;

    return valorImovel > 100000 && saldoDevedor > 0;
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

    console.log(this.resultado);
  }
}