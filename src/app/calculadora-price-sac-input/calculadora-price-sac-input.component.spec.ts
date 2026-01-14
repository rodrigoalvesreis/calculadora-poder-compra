import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraPriceSacInputComponent } from './calculadora-price-sac-input.component';

describe('CalculadoraPriceSacInputComponent', () => {
  let component: CalculadoraPriceSacInputComponent;
  let fixture: ComponentFixture<CalculadoraPriceSacInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraPriceSacInputComponent]
    });
    fixture = TestBed.createComponent(CalculadoraPriceSacInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
