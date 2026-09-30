import { TestBed } from '@angular/core/testing';
import { IScriptFile, ScriptLoadState } from '../models';

import { ScriptService } from './script.service';

describe('ScriptService', () => {
  const file = { id: 'a', module: 'm', name: 'a.ps1', directory: 'C:\\m' } as IScriptFile;
  let receivers: { [channel: string]: (...args: any[]) => void };

  beforeEach(() => {
    receivers = { };
    spyOn((window as any).proxyApi, 'receive').and.callFake((channel: string, handler: (...args: any[]) => void) => {
      receivers[channel] = handler;
    });
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service = TestBed.inject(ScriptService);
    expect(service).toBeTruthy();
  });

  it('should report scripts as pending until a load state is received', () => {
    const service = TestBed.inject(ScriptService);

    expect(service.getLoadState(file)).toBe(ScriptLoadState.Pending);

    receivers['script:load-state']({ ids: ['a'], state: ScriptLoadState.Ready });
    expect(service.getLoadState(file)).toBe(ScriptLoadState.Ready);

    receivers['script:load-state']({ ids: ['a'], state: ScriptLoadState.Failed });
    expect(service.getLoadState(file)).toBe(ScriptLoadState.Failed);
  });

  it('should return scripts to pending when load states are reset', () => {
    const service = TestBed.inject(ScriptService);
    receivers['script:load-state']({ ids: ['a'], state: ScriptLoadState.Ready });

    service.resetLoadStates();

    expect(service.getLoadState(file)).toBe(ScriptLoadState.Pending);
  });
});
