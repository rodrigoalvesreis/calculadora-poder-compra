import { Component, Input, OnInit } from '@angular/core';
import { CalculadoraService, ResultadoCalculo } from '../calculadora.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-calculadora-price-sac-form',
  templateUrl: './calculadora-price-sac-form.component.html',
  styleUrls: ['./calculadora-price-sac-form.component.css']
})
export class CalculadoraPriceSacFormComponent implements OnInit {

  @Input()
  tipo: 'renda' | 'imovel' | 'prestacao' = 'renda';
  sistema: 'price' | 'sac' = 'price';

  form!: FormGroup;
  resultado !:ResultadoCalculo;



  constructor(private calculadoraService: CalculadoraService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      valor: [null, [Validators.required, Validators.min(100)]],      
      valorRenda: [null, [this.tipo == 'imovel' ? Validators.required : Validators.nullValidator, Validators.min(100)]],      
      sistema: ['price', Validators.required] // default PRICE
    });

    this.resultado = this.calculadoraService.gerarResultadoVazio();
  }



  setSistema(sistema: 'price' | 'sac') {
    this.sistema = sistema;
    this.calcular();
  }

  getPlaceHolder() {
    let descricao  = 'da Renda';
   
    if(this.tipo == 'imovel'){
      descricao = 'do Imóvel';
    }
    
    if(this.tipo == 'prestacao'){
      descricao = 'da Prestação';
    }

    return `Digite o valor ${descricao}`;
  }

  calcular() {

    if (this.form.invalid) {
      // Marca todos os campos como "touched" para disparar mensagens de erro
      this.form.markAllAsTouched();
    }
    else{
      const { valor, valorRenda } = this.form.value;
      
      if(this.tipo == 'imovel'){
        this.resultado = this.calculadoraService.calcularFinanciamentoImovelRenda(valor, valorRenda);
      }
      else{
        this.resultado = this.calculadoraService.calcularFinanciamento(valor, this.tipo);
      }

      console.log(this.resultado)
    }

  }

}
