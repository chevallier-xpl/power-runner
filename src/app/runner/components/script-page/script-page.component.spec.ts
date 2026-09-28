import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ScriptPageComponent } from './script-page.component';
import { NodeProxyRegistry, ScriptService, StatusService } from 'src/app/core/services';

describe('ScriptPageComponent', () => {
  let component: ScriptPageComponent;
  let fixture: ComponentFixture<ScriptPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScriptPageComponent ],
      providers: [
        { provide: ScriptService, useValue: jasmine.createSpyObj<ScriptService>('ScriptService', ['runAsync', 'stopAsync', 'editAsync']) },
        { provide: NodeProxyRegistry, useValue: jasmine.createSpyObj<NodeProxyRegistry>('NodeProxyRegistry', ['createScriptRef']) },
        { provide: StatusService, useValue: jasmine.createSpyObj<StatusService>('StatusService', ['setStatus']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
