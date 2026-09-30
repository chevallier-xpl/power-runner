import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, flush, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { IScriptFile } from './core/models';
import { AppService, ScriptService, SettingsService, StatusService } from './core/services';
import { MatDialog } from '@angular/material/dialog';

describe('AppComponent', () => {
  const appService = jasmine.createSpyObj<AppService>('AppService', ['getElevatedStatusAsync', 'reloadWindowAsync', 'exitAsync', 'minimizeAsync', 'maximizeAsync', 'restoreAsync', 'toggleDeveloperToolsAsync']);
  const scriptService = jasmine.createSpyObj<ScriptService>('ScriptService', ['disposeAsync', 'listAsync', 'listCachedAsync', 'preCacheAsync', 'resetLoadStates']);
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

  describe('with search paths', () => {
    const cachedFiles = [{ id: 'a', module: 'm', name: 'a.ps1', directory: 'D:\\m' }] as IScriptFile[];
    const searchedFiles = [...cachedFiles, { id: 'b', module: 'm', name: 'b.ps1', directory: 'D:\\m' }] as IScriptFile[];

    beforeEach(() => {
      settingsService.readAsync.and.returnValue(Promise.resolve({ basePath: 'D:\\', powerShellExecutable: '', searchPaths: ['m\\*.ps1'] }));
      scriptService.preCacheAsync.and.returnValue(Promise.resolve());
      scriptService.resetLoadStates.calls.reset();
    });

    const shownNames = (app: AppComponent): string[] => {
      let names: string[];
      app.nodes$.subscribe(nodes => names = [].concat(...nodes.map(n => n.children.map(c => c.name)))).unsubscribe();
      return names;
    };

    it('should show the last known scripts until the search completes', fakeAsync(() => {
      let completeSearch: (files: IScriptFile[]) => void;
      scriptService.listCachedAsync.and.returnValue(Promise.resolve(cachedFiles));
      scriptService.listAsync.and.returnValue(new Promise(r => completeSearch = r));
      const app = TestBed.createComponent(AppComponent).componentInstance;

      app.ngOnInit();
      flushMicrotasks();
      expect(scriptService.resetLoadStates).toHaveBeenCalled();
      expect(shownNames(app)).toEqual(['a.ps1']);

      completeSearch(searchedFiles);
      flush();
      expect(shownNames(app)).toEqual(['a.ps1', 'b.ps1']);
      expect(scriptService.preCacheAsync).toHaveBeenCalledWith(searchedFiles);
    }));

    it('should ignore the last known scripts when the search completes first', fakeAsync(() => {
      let returnCached: (files: IScriptFile[]) => void;
      scriptService.listCachedAsync.and.returnValue(new Promise(r => returnCached = r));
      scriptService.listAsync.and.returnValue(Promise.resolve(searchedFiles));
      const app = TestBed.createComponent(AppComponent).componentInstance;

      app.ngOnInit();
      flush();
      returnCached(cachedFiles);
      flush();

      expect(shownNames(app)).toEqual(['a.ps1', 'b.ps1']);
    }));
  });

});
