import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanciamentoObrasService } from '../financiamento-obras.service';

@Component({
  selector: 'app-imovel-planta',
  templateUrl: './imovel-planta.component.html'
})
export class ImovelPlantaComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private obrasService: FinanciamentoObrasService) {
    this.form = this.fb.group({
      valorImovel: [null, Validators.required],
      prazoObra: [null, Validators.required],
      percentualExecutado: [0, Validators.required]
    });
  }

  calcular() {
    if (this.form.valid) {
      const { valorImovel, prazoObra, percentualExecutado } = this.form.value;
      //this.resultado = this.obrasService.calcularImovelPlanta(valorImovel, prazoObra, percentualExecutado);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
