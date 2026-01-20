import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraPoderCompraFormComponent } from './calculadora-poder-compra-form.component';

describe('CalculadoraPoderCompraFormComponent', () => {
  let component: CalculadoraPoderCompraFormComponent;
  let fixture: ComponentFixture<CalculadoraPoderCompraFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraPoderCompraFormComponent]
    });
    fixture = TestBed.createComponent(CalculadoraPoderCompraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
