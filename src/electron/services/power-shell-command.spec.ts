import { IScript, ParamType, ScriptStatus } from '../../app/core/models';
import { PowerShellCommand } from './power-shell-command';

describe('PowerShellCommand', () => {
  const script = {
    id: 'sample',
    directory: 'C:\\Scripts',
    module: 'Scripts',
    name: 'Sample Script.ps1',
    description: '',
    hash: '',
    status: ScriptStatus.Stopped,
    params: [{
      name: 'Message',
      type: ParamType.String,
      default: '',
      value: 'hello world'
    }]
  } as IScript;

  it('should keep an executable path containing spaces separate from PowerShell arguments', () => {
    const executable = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';

    const invocation = PowerShellCommand.createScriptInvocation(executable, script, true);

    expect(invocation.executable).toBe(executable);
    expect(invocation.args).toEqual([
      '-NoProfile',
      '-NoExit',
      '-Command',
      '& \'.\\Sample Script.ps1\' -Message \'hello world\''
    ]);
  });

  it('should pass metadata and target script paths as separate arguments', () => {
    const invocation = PowerShellCommand.createMetadataInvocation(
      'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      'C:\\Program Files\\PowerRunner\\GetCommandMetadata.ps1',
      'C:\\My Scripts\\Sample.ps1'
    );

    expect(invocation.args).toEqual([
      '-NoProfile',
      '-File',
      'C:\\Program Files\\PowerRunner\\GetCommandMetadata.ps1',
      'C:\\My Scripts\\Sample.ps1'
    ]);
  });
});
