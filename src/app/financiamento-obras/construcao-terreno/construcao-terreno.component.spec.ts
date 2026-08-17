import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstrucaoTerrenoComponent } from './construcao-terreno.component';

describe('ConstrucaoTerrenoComponent', () => {
  let component: ConstrucaoTerrenoComponent;
  let fixture: ComponentFixture<ConstrucaoTerrenoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConstrucaoTerrenoComponent]
    });
    fixture = TestBed.createComponent(ConstrucaoTerrenoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
