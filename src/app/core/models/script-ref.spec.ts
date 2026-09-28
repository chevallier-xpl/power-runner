import { ScriptRef } from './script-ref';
import { IProxyApi } from './iproxy-api';
import { IScript } from './iscript';
import { ScriptStatus } from './script-status.enum';

describe('ScriptRef', () => {
  it('should register proxy listeners for script output and exit events', () => {
    const receive = jasmine.createSpy('receive');
    const script = { status: ScriptStatus.Pending } as IScript;

    const scriptRef = new ScriptRef(script, { receive } as unknown as IProxyApi, 'script-1');

    expect(scriptRef).toBeTruthy();
    expect(receive).toHaveBeenCalledWith('script-1:data', jasmine.any(Function));
    expect(receive).toHaveBeenCalledWith('script-1:exit', jasmine.any(Function));
  });
});
