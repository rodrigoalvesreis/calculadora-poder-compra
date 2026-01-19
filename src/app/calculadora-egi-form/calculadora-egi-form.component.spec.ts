import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraEgiFormComponent } from './calculadora-egi-form.component';

describe('CalculadoraEgiFormComponent', () => {
  let component: CalculadoraEgiFormComponent;
  let fixture: ComponentFixture<CalculadoraEgiFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculadoraEgiFormComponent]
    });
    fixture = TestBed.createComponent(CalculadoraEgiFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
