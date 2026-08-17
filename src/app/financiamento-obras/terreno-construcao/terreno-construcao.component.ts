import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-terreno-construcao',
  templateUrl: './terreno-construcao.component.html'
})
export class TerrenoConstrucaoComponent {
  form: FormGroup;
  resultado: any;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      valorTerreno: [null, Validators.required],
      valorObra: [null, Validators.required],
      prazoObra: [null, Validators.required],
      percentualExecutado: [0, Validators.required]
    });
  }

  calcular() {
    if (this.form.valid) {
      const { valorTerreno, valorObra, prazoObra, percentualExecutado } = this.form.value;
      // Futuramente chamaremos o serviço de cálculo
      this.resultado = { valorTerreno, valorObra, prazoObra, percentualExecutado };
    }
  }
}
