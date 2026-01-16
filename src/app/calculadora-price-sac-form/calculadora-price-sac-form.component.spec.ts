import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraPriceSacFormComponent } from './calculadora-price-sac-form.component';

describe('CalculadoraPriceSacInputComponent', () => {
  let component: CalculadoraPriceSacFormComponent;
  let fixture: ComponentFixture<CalculadoraPriceSacFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraPriceSacFormComponent]
    });
    fixture = TestBed.createComponent(CalculadoraPriceSacFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
