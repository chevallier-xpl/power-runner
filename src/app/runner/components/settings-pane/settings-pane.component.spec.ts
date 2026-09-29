import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { SettingsPaneComponent } from './settings-pane.component';
import { BrowseDialogService, SettingsService, StatusService } from 'src/app/core/services';

describe('SettingsPaneComponent', () => {
  let component: SettingsPaneComponent;
  let fixture: ComponentFixture<SettingsPaneComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsPaneComponent ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: SettingsService, useValue: jasmine.createSpyObj<SettingsService>('SettingsService', ['saveAsync']) },
        { provide: BrowseDialogService, useValue: jasmine.createSpyObj<BrowseDialogService>('BrowseDialogService', ['selectFileAsync']) },
        { provide: StatusService, useValue: jasmine.createSpyObj<StatusService>('StatusService', ['setStatus']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
