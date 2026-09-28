import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BrowseDirectoryFieldComponent } from './browse-directory-field.component';
import { BrowseDialogService } from 'src/app/core/services';

describe('BrowseDirectoryFieldComponent', () => {
  let component: BrowseDirectoryFieldComponent;
  let fixture: ComponentFixture<BrowseDirectoryFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BrowseDirectoryFieldComponent ],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: ControlContainer,
          useValue: {
            control: new FormGroup({
              path: new FormControl('')
            })
          }
        },
        { provide: BrowseDialogService, useValue: jasmine.createSpyObj<BrowseDialogService>('BrowseDialogService', ['selectDirectoryAsync']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseDirectoryFieldComponent);
    component = fixture.componentInstance;
    component.controlName = 'path';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
