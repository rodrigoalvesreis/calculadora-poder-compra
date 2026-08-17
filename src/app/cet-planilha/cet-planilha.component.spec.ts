import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CetPlanilhaComponent } from './cet-planilha.component';

describe('CetPlanilhaComponent', () => {
  let component: CetPlanilhaComponent;
  let fixture: ComponentFixture<CetPlanilhaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CetPlanilhaComponent]
    });
    fixture = TestBed.createComponent(CetPlanilhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
