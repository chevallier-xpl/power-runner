import { IScriptFile } from '../../app/core/models/iscript-file';

export interface IUncachedScriptFile {
  file: IScriptFile;
  hash: string;
}
