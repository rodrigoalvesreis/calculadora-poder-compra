import { TestBed } from '@angular/core/testing';
import { CalculadoraService } from './calculadora.service';



describe('FinanciamentoServiceService', () => {
  let service: CalculadoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculadoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
