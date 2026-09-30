require = require("esm")(module);

import { ChildProcess, execFile, spawn } from 'child_process';
import { App, BrowserWindow, clipboard, ipcMain } from 'electron';
import fs from 'fs';
import globby from 'globby';
import { IPty, spawn as ptySpawn } from 'node-pty';
import os from 'os';
import path from 'path';
import { IScript, IScriptExit, IScriptFile, IScriptLoadStateChange, ScriptLoadState, ScriptStatus } from '../../app/core/models';
import { RunSettings } from '../../app/run-settings';
import { IScriptMetadataResult, IUncachedScriptFile } from '../models';
import { NodeScriptCacheService } from './node-script-cache.service';
import { NodeSettingsService } from './node-settings.service';
import { PowerShellCommand } from './power-shell-command';

export class NodeScriptService {

  private static readonly Pause = '\x13';   // XOFF
  private static readonly Resume = '\x11';  // XON
  private static readonly FileExtensionRegex = /.ps1$/i;
  private static readonly NodeModulesRegex = /node_modules/i;
  private static readonly MetadataBatchSize = 25;
  private static readonly MetadataBatchConcurrency = Math.max(1, Math.min(4, os.cpus().length - 1));
  private static readonly MetadataLinePrefix = '##PowerRunnerMetadata##';
  // Walking dependency, repository and build output folders dominates search time on large source trees.
  private static readonly IgnoredDirectories = ['**/[nN]ode_modules/**', '**/.git/**', '**/[bB]in/**', '**/[oO]bj/**'];

  private _childProcesses = new Map<string, IPty | ChildProcess>();
  private _pendingScripts = new Map<string, { promise: Promise<void>, resolve: () => void }>();
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

    const files = await globby(fileGlobs, { ignore: NodeScriptService.IgnoredDirectories });
    const scripts = files.map(f => this.getScriptFile(f));
    await this._cache.setFileListAsync(fileGlobs, scripts);

    return scripts;
  }

  /**
   * Returns the result of the last listAsync call with the same globs, so the tree can show before the search completes.
   */
  public async listCachedAsync(fileGlobs: string[]): Promise<IScriptFile[]> {
    return this._cache.getFileListAsync(fileGlobs);
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
    // Reuse the in-flight pre-cache result instead of starting another PowerShell process.
    const pending = this._pendingScripts.get(file.id);
    if (pending) {
      await pending.promise;
    }

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

  /**
   * Caches metadata for all files, sending 'script:load-state' as each script becomes ready or fails.
   */
  public async preCacheAsync(files: IScriptFile[]): Promise<void> {
    const powerShellExecutable = await this._settings.getPowerShellExecutableAsync();

    const uncachedFiles = await this._cache.listUncachedFilesAsync(files, powerShellExecutable);
    const uncachedIds = new Set(uncachedFiles.map(u => u.file.id));
    this.sendLoadState(files.filter(f => !uncachedIds.has(f.id)).map(f => f.id), ScriptLoadState.Ready);
    uncachedFiles.forEach(u => this.addPendingScript(u.file.id));

    const batches: IUncachedScriptFile[][] = [];
    for (let i = 0; i < uncachedFiles.length; i += NodeScriptService.MetadataBatchSize) {
      batches.push(uncachedFiles.slice(i, i + NodeScriptService.MetadataBatchSize));
    }

    let nextBatch = 0;
    let failedCount = 0;
    const worker = async () => {
      while (nextBatch < batches.length) {
        const batch = batches[nextBatch++];
        const batchFailedCount = await this.preCacheBatchAsync(batch, powerShellExecutable);
        failedCount += batchFailedCount;
      }
    };

    try {
      const workerCount = Math.min(NodeScriptService.MetadataBatchConcurrency, batches.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    } finally {
      uncachedFiles.forEach(u => this.resolvePendingScript(u.file.id));
    }

    if (failedCount > 0) {
      throw new Error(`Pre-cache failed for ${failedCount} script(s)`);
    }
  }

  public async disposeAsync(): Promise<void> {
    await this._cache.disposeAsync();
  }

  /**
   * Parses and caches a batch of scripts in a single PowerShell process.
   * Returns the number of scripts that could not be parsed.
   */
  private async preCacheBatchAsync(entries: IUncachedScriptFile[], powerShellExecutable: string): Promise<number> {
    const received: boolean[] = new Array(entries.length).fill(false);
    const errored: number[] = [];
    const writes: Promise<void>[] = [];
    await this.internalParseBatchAsync(entries.map(e => e.file), powerShellExecutable, (index, script) => {
      received[index] = true;
      if (script) {
        writes.push(this.cacheParsedScriptAsync(entries[index], script));
      } else {
        errored.push(index);
      }
    });
    await Promise.all(writes);

    // The first script without any result is the one that stopped the batch process; scripts after it were never reached.
    const firstUnreached = received.indexOf(false);
    if (firstUnreached >= 0) {
      errored.push(firstUnreached);
    }

    let failedCount = 0;
    for (const i of errored) {
      // Fall back to a dedicated process so the failure is reported as it was before batching.
      try {
        const script = await this.internalParseAsync(entries[i].file, powerShellExecutable);
        await this.cacheParsedScriptAsync(entries[i], script);
      } catch (err) {
        console.error(err);
        failedCount++;
        this.sendLoadState([entries[i].file.id], ScriptLoadState.Failed);
        this.resolvePendingScript(entries[i].file.id);
      }
    }

    const unreached = firstUnreached >= 0
      ? entries.filter((entry, i) => i > firstUnreached && !received[i])
      : [];
    if (unreached.length > 0) {
      failedCount += await this.preCacheBatchAsync(unreached, powerShellExecutable);
    }

    return failedCount;
  }

  private async cacheParsedScriptAsync(entry: IUncachedScriptFile, script: IScript): Promise<void> {
    script.hash = entry.hash;
    try {
      await this._cache.setAsync(script);
    } catch (err) {
      // Metadata is still valid; parseAsync re-reads it when the cache write failed.
      console.error(err);
    }

    this.sendLoadState([entry.file.id], ScriptLoadState.Ready);
    this.resolvePendingScript(entry.file.id);
  }

  /**
   * Parses files in one PowerShell process, calling onResult as each script completes with the script,
   * or null when PowerShell reported an error for it. Files without a call were never reached.
   */
  private async internalParseBatchAsync(
    files: IScriptFile[],
    powerShellExecutable: string,
    onResult: (index: number, script: IScript) => void
  ): Promise<void> {
    const workingDirectory = this.getMetadataWorkingDirectory();
    const listPath = path.join(
      os.tmpdir(),
      `powerrunner-metadata-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`
    );

    const handleLine = (line: string) => {
      if (!line.startsWith(NodeScriptService.MetadataLinePrefix)) {
        return;
      }

      let result: IScriptMetadataResult;
      try {
        result = JSON.parse(line.substring(NodeScriptService.MetadataLinePrefix.length));
      } catch (err) {
        console.error(err, line);
        return;
      }

      if (!(result.index >= 0 && result.index < files.length)) {
        return;
      }

      if (result.metadata) {
        onResult(result.index, Object.assign({ }, files[result.index], result.metadata) as IScript);
      } else {
        console.warn(`Unable to read metadata for ${result.path}: ${result.error}`);
        onResult(result.index, null);
      }
    };

    try {
      await fs.promises.writeFile(listPath, files.map(f => `${f.directory}\\${f.name}`).join('\r\n'), 'utf8');

      const invocation = PowerShellCommand.createMetadataBatchInvocation(
        powerShellExecutable,
        `${workingDirectory}\\GetCommandMetadata.ps1`,
        listPath
      );
      await new Promise<void>(resolve => {
        const child = spawn(invocation.executable, invocation.args, {
          cwd: workingDirectory,
          stdio: ['ignore', 'pipe', 'ignore'],
          windowsHide: true
        });

        try {
          // Keep the UI responsive while PowerShell starts and parses in the background.
          os.setPriority(child.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
        } catch {
          // Priority is best effort.
        }

        let buffer = '';
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
          buffer += chunk;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop();
          lines.forEach(handleLine);
        });
        child.on('error', err => {
          console.error(err);
          resolve();
        });
        child.on('close', (code) => {
          if (code !== 0) {
            // Results written before the failure are still valid.
            console.error(`Metadata batch exited with code ${code}`);
          }
          handleLine(buffer);
          resolve();
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      await fs.promises.unlink(listPath).catch(() => undefined);
    }
  }

  private addPendingScript(id: string): void {
    if (this._pendingScripts.has(id)) {
      return;
    }

    let resolve: () => void;
    const promise = new Promise<void>(r => resolve = r);
    this._pendingScripts.set(id, { promise, resolve });
  }

  private resolvePendingScript(id: string): void {
    const pending = this._pendingScripts.get(id);
    if (pending) {
      this._pendingScripts.delete(id);
      pending.resolve();
    }
  }

  private sendLoadState(ids: string[], state: ScriptLoadState): void {
    if (ids.length > 0 && this._browserWindow && !this._browserWindow.isDestroyed()) {
      this._browserWindow.webContents.send('script:load-state', { ids, state } as IScriptLoadStateChange);
    }
  }
  private getMetadataWorkingDirectory(): string {
    const resourcesPath = !NodeScriptService.NodeModulesRegex.test(process.resourcesPath)
      ? `${process.resourcesPath}\\app`
      : path.dirname(this._app.getAppPath());
    return `${resourcesPath}\\electron\\powershell`;
  }

  private async internalParseAsync(file: IScriptFile, powerShellExecutable: string): Promise<IScript> {
    return new Promise((resolve, reject) => {

      const filePath = `${file.directory}\\${file.name}`;
      const workingDirectory = this.getMetadataWorkingDirectory();
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
