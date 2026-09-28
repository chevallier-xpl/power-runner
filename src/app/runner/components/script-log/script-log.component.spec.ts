import { Directive, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { ScriptLogComponent } from './script-log.component';

@Directive({
  selector: '[pruScriptLogWriter]',
  exportAs: 'scriptLogWriter'
})
class MockScriptLogWriterDirective {
  @Input() public scriptRef: unknown;

  public searchNext(): void {
  }

  public searchPrevious(): void {
  }

  public onResize(): void {
  }
}

describe('ScriptLogComponent', () => {
  let component: ScriptLogComponent;
  let fixture: ComponentFixture<ScriptLogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScriptLogComponent, MockScriptLogWriterDirective ],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
