import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AppUpdateDialogComponent } from './app-update-dialog.component';

describe('AppUpdateDialogComponent', () => {
  let component: AppUpdateDialogComponent;
  let fixture: ComponentFixture<AppUpdateDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppUpdateDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj<MatDialogRef<AppUpdateDialogComponent>>('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { version: '1.2.1' } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppUpdateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
