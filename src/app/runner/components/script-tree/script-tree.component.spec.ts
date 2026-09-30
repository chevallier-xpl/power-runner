import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IScriptFile, ScriptLoadState } from 'src/app/core/models';
import { ScriptService } from 'src/app/core/services';

import { ScriptTreeComponent } from './script-tree.component';

describe('ScriptTreeComponent', () => {
  let component: ScriptTreeComponent;
  let fixture: ComponentFixture<ScriptTreeComponent>;
  const states: { [id: string]: ScriptLoadState } = { };
  const scriptService = { getLoadState: (file: IScriptFile) => states[file.id] || ScriptLoadState.Pending };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScriptTreeComponent ],
      providers: [{ provide: ScriptService, useValue: scriptService }],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should report the load state of each script', () => {
    const ready = { id: 'ready' } as IScriptFile;
    states.ready = ScriptLoadState.Ready;

    expect(component.getLoadState(ready)).toBe(ScriptLoadState.Ready);
    expect(component.getLoadState({ id: 'other' } as IScriptFile)).toBe(ScriptLoadState.Pending);
  });
});
