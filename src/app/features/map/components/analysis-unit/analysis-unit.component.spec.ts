import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisUnitComponent } from './analysis-unit.component';

describe('AnalysisUnitComponent', () => {
  let component: AnalysisUnitComponent;
  let fixture: ComponentFixture<AnalysisUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalysisUnitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
