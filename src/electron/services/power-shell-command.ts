import { IScript } from '../../app/core/models';
import { ScriptFormatter } from '../../app/core/utils/script-formatter';

export interface IPowerShellInvocation {
  executable: string;
  args: string[];
}

export class PowerShellCommand {
  public static createScriptCommand(script: IScript): string {
    const scriptName = PowerShellCommand.quote(`.\\${script.name}`);
    const paramList = script.params.map(p => ScriptFormatter.formatParam(p)).filter(p => p).join(' ');
    return `& ${scriptName}${paramList ? ` ${paramList}` : ''}`;
  }

  public static createScriptInvocation(
    executable: string,
    script: IScript,
    keepOpen: boolean = false
  ): IPowerShellInvocation {
    const args = ['-NoProfile'];
    if (keepOpen) {
      args.push('-NoExit');
    }
    args.push('-Command', PowerShellCommand.createScriptCommand(script));
    return { executable, args };
  }

  public static createMetadataInvocation(
    executable: string,
    metadataScriptPath: string,
    scriptPath: string
  ): IPowerShellInvocation {
    return {
      executable,
      args: ['-NoProfile', '-File', metadataScriptPath, scriptPath]
    };
  }

  public static createMetadataBatchInvocation(
    executable: string,
    metadataScriptPath: string,
    scriptListPath: string
  ): IPowerShellInvocation {
    return {
      executable,
      args: ['-NoProfile', '-File', metadataScriptPath, '-scriptListPath', scriptListPath]
    };
  }

  private static quote(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
  }
}
