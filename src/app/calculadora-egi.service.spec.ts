import { TestBed } from '@angular/core/testing';

import { CalculadoraEgiService } from './calculadora-egi.service';

describe('CalculadoraEgiService', () => {
  let service: CalculadoraEgiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculadoraEgiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
