import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraPoderCompraComponent } from './calculadora-poder-compra.component';

describe('CalculadoraPoderCompraComponent', () => {
  let component: CalculadoraPoderCompraComponent;
  let fixture: ComponentFixture<CalculadoraPoderCompraComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraPoderCompraComponent]
    });
    fixture = TestBed.createComponent(CalculadoraPoderCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
