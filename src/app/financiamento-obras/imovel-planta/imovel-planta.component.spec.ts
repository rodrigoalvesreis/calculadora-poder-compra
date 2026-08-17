import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImovelPlantaComponent } from './imovel-planta.component';

describe('ImovelPlantaComponent', () => {
  let component: ImovelPlantaComponent;
  let fixture: ComponentFixture<ImovelPlantaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImovelPlantaComponent]
    });
    fixture = TestBed.createComponent(ImovelPlantaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
