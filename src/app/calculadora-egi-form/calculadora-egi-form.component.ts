import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalculadoraEGIService, CalculadoraEGIResult } from '../calculadora-egi.service';

@Component({
  selector: 'app-calculadora-egi-form',
  templateUrl: './calculadora-egi-form.component.html',
  styleUrls: ['./calculadora-egi-form.component.css']
})
export class CalculadoraEgiFormComponent implements OnInit {
  form!: FormGroup;
  resultado?: CalculadoraEGIResult;

  constructor(
    private egiService: CalculadoraEGIService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      valorImovel: [null, [Validators.required, Validators.min(1)]],
      valorRenda: [null, [Validators.required, Validators.min(1)]],
      saldoDevedor: [null, [Validators.required, Validators.min(0)]]
    });
  }

  calcular(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { valorImovel, valorRenda, saldoDevedor } = this.form.value;

    this.resultado = this.egiService.calcularEGI({
      rendaMensal: valorRenda,
      valorImovel: valorImovel,
      saldoDevedor: saldoDevedor
    });
  }
}