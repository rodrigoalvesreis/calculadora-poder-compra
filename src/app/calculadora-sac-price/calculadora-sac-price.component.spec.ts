import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraSacPriceComponent } from './calculadora-sac-price.component';

describe('CalculadoraSacPriceComponent', () => {
  let component: CalculadoraSacPriceComponent;
  let fixture: ComponentFixture<CalculadoraSacPriceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraSacPriceComponent]
    });
    fixture = TestBed.createComponent(CalculadoraSacPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
