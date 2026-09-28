require = require("esm")(module);

import { ChildProcess, execFile, spawn } from 'child_process';
import { App, BrowserWindow, clipboard, ipcMain } from 'electron';
import globby from 'globby';
import { IPty, spawn as ptySpawn } from 'node-pty';
import os from 'os';
import path from 'path';
import { IScript, IScriptExit, IScriptFile, ScriptStatus } from '../../app/core/models';
import { RunSettings } from '../../app/run-settings';
import { NodeScriptCacheService } from './node-script-cache.service';
import { NodeSettingsService } from './node-settings.service';
import { PowerShellCommand } from './power-shell-command';

export class NodeScriptService {

  private static readonly Pause = '\x13';   // XOFF
  private static readonly Resume = '\x11';  // XON
  private static readonly FileExtensionRegex = /.ps1$/i;
  private static readonly NodeModulesRegex = /node_modules/i;

  private _childProcesses = new Map<string, IPty | ChildProcess>();
  private _outputColumns = 120;
  private _outputRows = 30;

  constructor(
    private _app: App,
    private _browserWindow: BrowserWindow,
    private _cache: NodeScriptCacheService,
    private _settings: NodeSettingsService
  ) {
    ipcMain.on('script:data-ack', (event: any, scriptId: string) => {
      const child = this._childProcesses.get(scriptId);
      if (child && NodeScriptService.isPty(child)) {
        child.write(NodeScriptService.Resume);
      }
    });
    ipcMain.on('output:resize', (event: any, columns: number, rows: number) => {
      this._outputColumns = columns;
      this._outputRows = rows;
      this._childProcesses.forEach(p => {
        if (NodeScriptService.isPty(p)) {
          p.resize(columns, rows);
        }
      });
    });
  }

  public async listAsync(fileGlobs: string[]): Promise<IScriptFile[]> {

    const files = await globby(fileGlobs);
    const scripts = await Promise.all(files.map(f => this.getScriptFile(f)));

    return scripts;
  }

  public editAsync(script: IScriptFile): Promise<void>  {

    spawn('Code.exe', [`${script.directory}/${script.name}`], {
      cwd: `${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code`, // TODO GBJ: Make compatible with Linux.
      stdio: 'ignore',
      detached: true
    });

    return Promise.resolve();
  }

  public async runAsync(script: IScript, runExternal: boolean = false): Promise<string>  {
    const powerShellExecutable = await this._settings.getPowerShellExecutableAsync();
    const invocation = PowerShellCommand.createScriptInvocation(powerShellExecutable, script, runExternal);
    const scriptChannel = NodeScriptService.getScriptChannel(script);

    if (runExternal) {
      clipboard.writeText(PowerShellCommand.createScriptCommand(script));
      return this.runExternalAsync(script, scriptChannel, invocation.executable, invocation.args);
    }

    return new Promise((resolve, reject) => {
      try {
        const child = ptySpawn(invocation.executable, invocation.args, {
          name: 'xterm-color',
          cols: this._outputColumns,
          rows: this._outputRows,
          cwd: script.directory,
          env: process.env,
          handleFlowControl: true
        });

        this._childProcesses.set(script.id, child);

        child.onData((data: string) => {
          child.write(NodeScriptService.Pause);
          this._browserWindow.webContents.send(`${scriptChannel}:data`, data);
        });
        child.onExit(({ exitCode }) => {
          this._browserWindow.webContents.send(`${scriptChannel}:exit`, { scriptName: script.name, exitCode } as IScriptExit);
          this._childProcesses.delete(script.id);
        });

        ipcMain.on('terminal.key', (event, key) => {
          child.write(key);
        });

        setTimeout(() => {
          this._browserWindow.webContents.send(`${scriptChannel}:data`, PowerShellCommand.createScriptCommand(script));
        }, 1);

        // Reply with a channel to listen on for stdout, stderr, and exit.
        resolve(scriptChannel);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  public async stopAsync(script: IScriptFile): Promise<void> {
    const child = this._childProcesses.get(script.id);
    if (child) {
      try {
        if (NodeScriptService.isPty(child)) {
          child.write(NodeScriptService.Pause);
        }
        child.kill();
      } catch {
        // Do nothing.
      }
    }
  }

  public async parseAsync(file: IScriptFile): Promise<IScript> {
    const powerShellExecutable = await this._settings.getPowerShellExecutableAsync();

    let script: IScript;
    if (!RunSettings.Cache) {
      script = await this.internalParseAsync(file, powerShellExecutable);
      return script;
    }

    const hash = await this._cache.getFileHashAsync(file, powerShellExecutable);
    script = await this._cache.getAsync(file.module, file.name);
    if (!script || script.hash !== hash) {
      script = await this.internalParseAsync(file, powerShellExecutable);
      script.hash = hash;
      await this._cache.setAsync(script);
    }

    script.status = ScriptStatus.Stopped;

    return script;
  }

  public async preCacheAsync(files: IScriptFile[]): Promise<void> {
    const powerShellExecutable = await this._settings.getPowerShellExecutableAsync();

    const uncachedFiles = await this._cache.listUncachedFilesAsync(files, powerShellExecutable);

    for (const entry of uncachedFiles) {
      const script = await this.internalParseAsync(entry.file, powerShellExecutable);
      script.hash = entry.hash;
      await this._cache.setAsync(script);
    }
  }

  public async disposeAsync(): Promise<void> {
    await this._cache.disposeAsync();
  }

  private async internalParseAsync(file: IScriptFile, powerShellExecutable: string): Promise<IScript> {
    return new Promise((resolve, reject) => {

      const filePath = `${file.directory}\\${file.name}`;
      const resourcesPath = !NodeScriptService.NodeModulesRegex.test(process.resourcesPath)
        ? `${process.resourcesPath}\\app`
        : path.dirname(this._app.getAppPath());
      const workingDirectory = `${resourcesPath}\\electron\\powershell`;
      const metadataScriptPath = `${workingDirectory}\\GetCommandMetadata.ps1`;
      const invocation = PowerShellCommand.createMetadataInvocation(
        powerShellExecutable,
        metadataScriptPath,
        filePath
      );
      execFile(invocation.executable, invocation.args, { cwd: workingDirectory }, (error, stdout, stderr) => {

        if (error) {
          console.error(error);
          reject(error);
        } else if (stdout) {

          try {
            // Ensure result is always an array.
            const metadata = JSON.parse(stdout);
            const script = Object.assign({ }, file, metadata) as IScript;
            resolve(script);
          } catch (err) {
            console.error(err, stdout);
            reject(err);
          }
        } else if (stderr) {
          console.error(stderr);
          reject(stderr);
        } else {
          // No parameters available.
          const script = Object.assign({ }, file) as IScript;
          script.params = [];
          resolve(script);
        }
      });
    });
  }

  private runExternalAsync(
    script: IScript,
    scriptChannel: string,
    executable: string,
    args: string[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd: script.directory,
        detached: true,
        env: process.env,
        stdio: 'ignore',
        windowsHide: false
      });

      child.once('error', err => {
        this._childProcesses.delete(script.id);
        reject(err);
      });
      child.once('spawn', () => {
        this._childProcesses.set(script.id, child);
        resolve(scriptChannel);
      });
      child.once('exit', exitCode => {
        this._browserWindow.webContents.send(`${scriptChannel}:exit`, {
          scriptName: script.name,
          exitCode: exitCode === null ? -1 : exitCode
        } as IScriptExit);
        this._childProcesses.delete(script.id);
      });
      child.unref();
    });
  }

  private getScriptFile(filePath: string): IScriptFile {

    let directory = path.dirname(filePath);
    if (os.platform() === 'win32') {
      directory = directory.replace(/\//g, '\\');
    }

    const name = path.basename(filePath);
    const id = `${directory.replace(/\//g, '_')}_${name}`;
    const file: IScriptFile = {
      id,
      directory,
      module: path.basename(directory),
      name
    };

    return file;
  }

  private static getScriptChannel(script: IScript): string {
    const name = script.name.replace(NodeScriptService.FileExtensionRegex, '');
    return `${script.module}_${name}`;
  }

  private static isPty(child: IPty | ChildProcess): child is IPty {
    return typeof (child as IPty).write === 'function';
  }
}
