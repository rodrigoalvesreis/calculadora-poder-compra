import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrenoConstrucaoComponent } from './terreno-construcao.component';

describe('TerrenoConstrucaoComponent', () => {
  let component: TerrenoConstrucaoComponent;
  let fixture: ComponentFixture<TerrenoConstrucaoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TerrenoConstrucaoComponent]
    });
    fixture = TestBed.createComponent(TerrenoConstrucaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
