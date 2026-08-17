import { Component } from '@angular/core';
import { FinanciamentoObrasService } from '../financiamento-obras.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-financiamento-obras',
  templateUrl: './financiamento-obras.component.html',
  styleUrls: ['./financiamento-obras.component.css']
})
export class FinanciamentoObrasComponent {

  form: FormGroup;
  resultado: any;

  constructor(private fb: FormBuilder, private obrasService: FinanciamentoObrasService) {
    this.form = this.fb.group({
      valorObra: [null, Validators.required],
      prazoObra: [null, Validators.required],
      percentualExecutado: [0, Validators.required]
    });
  }

   calcular() {
    if (this.form.valid) {
      const { valorObra, prazoObra, percentualExecutado } = this.form.value;
      //this.resultado = this.obrasService.calcularConstrucaoTerreno(valorObra, prazoObra, percentualExecutado);
    }
  }

}
