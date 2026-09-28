import { ScriptLogWriterDirective } from './script-log-writer.directive';
import { ElementRef } from '@angular/core';
import { StatusService } from 'src/app/core/services';

describe('ScriptLogWriterDirective', () => {
  it('should create an instance', () => {
    const directive = new ScriptLogWriterDirective(
      new ElementRef(document.createElement('div')),
      jasmine.createSpyObj<StatusService>('StatusService', ['setStatus'])
    );

    expect(directive).toBeTruthy();
  });
});
