import { IScriptParam } from '../../app/core/models';

export interface IScriptMetadataResult {
  index: number;
  path: string;
  metadata?: {
    description: string;
    params: IScriptParam[];
  };
  error?: string;
}
