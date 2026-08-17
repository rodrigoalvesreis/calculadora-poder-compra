import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanciamentoObrasComponent } from './financiamento-obras.component';

describe('FinanciamentoObrasComponent', () => {
  let component: FinanciamentoObrasComponent;
  let fixture: ComponentFixture<FinanciamentoObrasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FinanciamentoObrasComponent]
    });
    fixture = TestBed.createComponent(FinanciamentoObrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
