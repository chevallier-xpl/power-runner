import { Injectable, NgZone } from '@angular/core';
import { IProxyApi, IScript, IScriptFile, IScriptLoadStateChange, ScriptLoadState } from '../models';
import { RunSettings } from '../../run-settings';
import { NodeProxyRegistry } from './node-proxy.registry';
import { ProxyNodeService } from './proxy-node-service';
import { StatusService } from './status.service';
const proxyApi: IProxyApi = (window as any).proxyApi;

@Injectable({
  providedIn: 'root'
})
export class ScriptService extends ProxyNodeService {

  private _loadStates = new Map<string, ScriptLoadState>();

  constructor(
    private _statusService: StatusService,
    private _ngZone: NgZone
  ) {
    super('NodeScriptService');

    proxyApi.receive('script:load-state', (change: IScriptLoadStateChange) => {
      this._ngZone.run(() => change.ids.forEach(id => this._loadStates.set(id, change.state)));
    });
  }

  public getLoadState(file: IScriptFile): ScriptLoadState {
    if (!RunSettings.PreCache) {
      return ScriptLoadState.Ready;
    }

    return this._loadStates.get(file.id) || ScriptLoadState.Pending;
  }

  public resetLoadStates(): void {
    this._loadStates.clear();
  }

  public async listAsync(fileGlobs: string[]): Promise<IScriptFile[]> {
    return this.proxy.invoke('listAsync', fileGlobs);
  }

  public async listCachedAsync(fileGlobs: string[]): Promise<IScriptFile[]> {
    return this.proxy.invoke('listCachedAsync', fileGlobs);
  }

  public async runAsync(script: IScript, runExternal: boolean = false): Promise<string> {
    this._statusService.setStatus(`${script.module.toUpperCase()}/${script.name} running...`);
    return this.proxy.invoke('runAsync', script, runExternal);
  }

  public async stopAsync(script: IScriptFile): Promise<string> {
    this._statusService.setStatus(`${script.module.toUpperCase()}/${script.name} stopping...`);
    return this.proxy.invoke('stopAsync', script);
  }

  public async editAsync(script: IScriptFile): Promise<IScript[]> {
    return this.proxy.invoke('editAsync', script);
  }

  public async parseAsync(file: IScriptFile): Promise<IScript> {
    this._statusService.setStatus(`Loading ${file.module.toUpperCase()}/${file.name}...`);
    return this.proxy.invoke('parseAsync', file);
  }

  public async preCacheAsync(files: IScriptFile[]): Promise<void> {
    await this.proxy.invoke('preCacheAsync', files);
  }

  public async disposeAsync(): Promise<void> {
    return this.proxy.invoke('diposeAsync');
  }
}
