import { Component } from '@angular/core';

@Component({
  selector: 'app-calculadora-egi',
  templateUrl: './calculadora-egi.component.html',
  styleUrls: ['./calculadora-egi.component.css']
})
export class CalculadoraEgiComponent {
  /**
   * Este componente atua como o container principal da Calculadora EGI.
   * A lógica de negócio e os campos de entrada foram movidos para 
   * o CalculadoraEgiFormComponent para melhor organização e reuso.
   */
  constructor() { }
}