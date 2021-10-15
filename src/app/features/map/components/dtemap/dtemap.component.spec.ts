import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DTEMapComponent } from './dtemap.component';

describe('DTEMapComponent', () => {
  let component: DTEMapComponent;
  let fixture: ComponentFixture<DTEMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DTEMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DTEMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
