import { TestBed } from '@angular/core/testing';
import fs from 'fs-extra';
import yaml from 'node-yaml';

import { NodeSettingsService } from './node-settings.service';

describe('NodeSettingsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NodeSettingsService = TestBed.get(NodeSettingsService);
    expect(service).toBeTruthy();
  });

  it('should initialize the Windows PowerShell executable when settings have not been saved', async () => {
    spyOn(fs, 'pathExists').and.returnValue(Promise.resolve(false));
    const service = new NodeSettingsService();

    const settings = await service.readAsync();

    expect(settings.powerShellExecutable).toBe(NodeSettingsService.DefaultPowerShellExecutable);
  });

  it('should add the default executable to settings saved by older versions', async () => {
    spyOn(fs, 'pathExists').and.returnValue(Promise.resolve(true));
    spyOn(yaml, 'read').and.returnValue(Promise.resolve({
      basePath: 'C:\\Scripts',
      searchPaths: ['**\\*.ps1']
    }));
    const service = new NodeSettingsService();

    const settings = await service.readAsync();

    expect(settings.powerShellExecutable).toBe(NodeSettingsService.DefaultPowerShellExecutable);
    expect(settings.basePath).toBe('C:\\Scripts');
  });

  it('should reject a missing executable rather than saving it', async () => {
    spyOn(fs, 'pathExists').and.returnValue(Promise.resolve(false));
    spyOn(yaml, 'write');
    const service = new NodeSettingsService();

    await expectAsync(service.saveAsync({
      basePath: 'C:\\Scripts',
      powerShellExecutable: 'C:\\Missing\\pwsh.exe',
      searchPaths: ['**\\*.ps1']
    })).toBeRejectedWithError('PowerShell executable not found: C:\\Missing\\pwsh.exe');
    expect(yaml.write).not.toHaveBeenCalled();
  });
});
