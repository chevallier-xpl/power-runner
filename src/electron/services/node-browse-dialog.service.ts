import { BrowserWindow } from 'electron';
const electron = require('electron');
const dialog = electron.dialog;

export class NodeBrowseDialogService {

  constructor(
    private _browserWindow: BrowserWindow
  ) { }

  public selectDirectoryAsync(): Promise<string> {
    return this.selectAsync(['openDirectory']);
  }

  public selectFileAsync(): Promise<string> {
    return this.selectAsync(['openFile'], [
      { name: 'PowerShell executable', extensions: ['exe'] },
      { name: 'All files', extensions: ['*'] }
    ]);
  }

  private selectAsync(properties: Array<'openDirectory' | 'openFile'>, filters?: Electron.FileFilter[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      dialog.showOpenDialog(this._browserWindow, {
        properties,
        filters
      }).then(result => {
        if (!result.canceled) {
          resolve(result.filePaths[0]);
        } else {
          resolve('');
        }
      }, err => {
        reject(err);
      });
    });
  }
}
