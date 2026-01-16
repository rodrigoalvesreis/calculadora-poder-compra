import { Component, Input, OnInit } from '@angular/core';
import { FinanciamentoService, ResultadoCalculo } from '../financiamento-service.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-calculadora-price-sac-form',
  templateUrl: './calculadora-price-sac-form.component.html',
  styleUrls: ['./calculadora-price-sac-form.component.css']
})
export class CalculadoraPriceSacFormComponent implements OnInit {

  @Input()
  tipo: 'renda' | 'imovel' = 'renda';

  sistema: 'price' | 'sac' = 'price';

  form!: FormGroup;
  resultado !:ResultadoCalculo;


  constructor(private financiamentoService: FinanciamentoService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      valor: [null, [Validators.required, Validators.min(1000)]],
      prazo: [null, [Validators.required, Validators.min(5), Validators.max(35)]],
      sistema: ['price', Validators.required] // default PRICE
    });
  }



  setSistema(sistema: 'price' | 'sac') {
    this.sistema = sistema;
    this.calcular();
  }

  getPlaceHolder() {
    return `Digite o valor ${this.tipo == 'renda' ? 'da Renda' : 'do Imóvel'}`
  }

  calcular() {

    if (this.form.invalid) {
      // Marca todos os campos como "touched" para disparar mensagens de erro
      this.form.markAllAsTouched();
    }
    else{
      const { valor, prazo } = this.form.value;
      this.resultado = this.financiamentoService.calcularFinanciamento(valor, prazo, this.sistema, this.tipo);

      console.log(this.resultado)
    }

  }

}
