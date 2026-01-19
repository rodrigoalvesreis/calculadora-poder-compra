import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraEgiComponent } from './calculadora-egi.component';

describe('CalculadoraEgiComponent', () => {
  let component: CalculadoraEgiComponent;
  let fixture: ComponentFixture<CalculadoraEgiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraEgiComponent]
    });
    fixture = TestBed.createComponent(CalculadoraEgiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
