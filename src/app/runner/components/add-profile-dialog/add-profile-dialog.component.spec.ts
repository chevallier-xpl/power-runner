import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AddProfileDialogComponent } from './add-profile-dialog.component';
import { SaveAsType } from 'src/app/core/models';

describe('AddProfileDialogComponent', () => {
  let component: AddProfileDialogComponent;
  let fixture: ComponentFixture<AddProfileDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddProfileDialogComponent ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj<MatDialogRef<AddProfileDialogComponent>>('MatDialogRef', ['close']) },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            profile: { title: '', name: '', saveAsType: SaveAsType.Personal },
            existingProfiles: []
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideTemplate(AddProfileDialogComponent, '')
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddProfileDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
