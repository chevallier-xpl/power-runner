import { Injectable } from '@angular/core';
import fs from 'fs-extra';
import yaml from 'node-yaml';
import os from 'os';
import path from 'path';
import { ISettings } from '../../app/core/models';

@Injectable({
  providedIn: 'root'
})
export class NodeSettingsService {
  public static readonly DefaultPowerShellExecutable =
    `${process.env.SYSTEMROOT || 'C:\\Windows'}\\system32\\WindowsPowerShell\\v1.0\\powershell.exe`;

  private _settingsFile: string;

  constructor() {
    this._settingsFile = path.join(os.homedir(), '.powerrunner', 'settings.yaml');
  }

  public async saveAsync(settings: ISettings): Promise<void> {
    await this.validatePowerShellExecutableAsync(settings.powerShellExecutable);

    const settingsDirectory = path.dirname(this._settingsFile);
    await fs.ensureDir(settingsDirectory);
    await yaml.write(this._settingsFile, Object.assign({}, settings, {
      powerShellExecutable: settings.powerShellExecutable.trim()
    }));
  }

  public async readAsync(): Promise<ISettings> {
    let settings: ISettings = {
      basePath: '',
      powerShellExecutable: NodeSettingsService.DefaultPowerShellExecutable,
      searchPaths: []
    };
    const hasSettings = await fs.pathExists(this._settingsFile);
    if (hasSettings) {
      const savedSettings = await yaml.read(this._settingsFile);
      settings = Object.assign(settings, savedSettings);
    }

    return settings;
  }

  public async getPowerShellExecutableAsync(): Promise<string> {
    const settings = await this.readAsync();
    await this.validatePowerShellExecutableAsync(settings.powerShellExecutable);
    return settings.powerShellExecutable;
  }

  private async validatePowerShellExecutableAsync(executable: string): Promise<void> {
    if (!executable || !executable.trim()) {
      throw new Error('A PowerShell executable path is required.');
    }

    const executablePath = executable.trim();
    const exists = await fs.pathExists(executablePath);
    if (!exists) {
      throw new Error(`PowerShell executable not found: ${executablePath}`);
    }

    const stats = await fs.stat(executablePath);
    if (!stats.isFile()) {
      throw new Error(`PowerShell executable path is not a file: ${executablePath}`);
    }
  }
}
