import { ScriptLoadState } from './script-load-state.enum';

export interface IScriptLoadStateChange {
  ids: string[];
  state: ScriptLoadState;
}
