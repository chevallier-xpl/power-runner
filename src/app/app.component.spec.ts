import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AppService, ScriptService, SettingsService, StatusService } from './core/services';
import { MatDialog } from '@angular/material/dialog';

describe('AppComponent', () => {
  const appService = jasmine.createSpyObj<AppService>('AppService', ['getElevatedStatusAsync', 'reloadWindowAsync', 'exitAsync', 'minimizeAsync', 'maximizeAsync', 'restoreAsync', 'toggleDeveloperToolsAsync']);
  const scriptService = jasmine.createSpyObj<ScriptService>('ScriptService', ['disposeAsync']);
  const settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', ['readAsync']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: AppService, useValue: appService },
        { provide: ScriptService, useValue: scriptService },
        { provide: SettingsService, useValue: settingsService },
        { provide: StatusService, useValue: { status$: of(''), setStatus: () => undefined } },
        { provide: MatDialog, useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideTemplate(AppComponent, '')
      .compileComponents();

    appService.getElevatedStatusAsync.and.returnValue(Promise.resolve(''));
    scriptService.disposeAsync.and.returnValue(Promise.resolve());
    settingsService.readAsync.and.returnValue(Promise.resolve({ basePath: '', powerShellExecutable: '', searchPaths: [] }));
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'powerrunner'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('powerrunner');
  });

});
