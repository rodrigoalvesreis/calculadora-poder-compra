import { TestBed } from '@angular/core/testing';

import { FinanciamentoObrasService } from './financiamento-obras.service';

describe('FinanciamentoObrasService', () => {
  let service: FinanciamentoObrasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinanciamentoObrasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
