import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ScriptFormComponent } from './script-form.component';
import { ProfileService, ScriptService, StatusService } from 'src/app/core/services';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';

describe('ScriptFormComponent', () => {
  let component: ScriptFormComponent;
  let fixture: ComponentFixture<ScriptFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScriptFormComponent ],
      providers: [
        { provide: MatDialog, useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open']) },
        { provide: ProfileService, useValue: jasmine.createSpyObj<ProfileService>('ProfileService', ['listAsync', 'updateAsync', 'deleteAsync']) },
        { provide: StatusService, useValue: jasmine.createSpyObj<StatusService>('StatusService', ['setStatus']) },
        { provide: ScriptService, useValue: jasmine.createSpyObj<ScriptService>('ScriptService', ['parseAsync']) },
        { provide: Clipboard, useValue: jasmine.createSpyObj<Clipboard>('Clipboard', ['copy']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
