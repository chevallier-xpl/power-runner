import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { StatusBarComponent } from './status-bar.component';
import { AppService, StatusService } from 'src/app/core/services';

describe('StatusBarComponent', () => {
  let component: StatusBarComponent;
  let fixture: ComponentFixture<StatusBarComponent>;
  const appService = jasmine.createSpyObj<AppService>('AppService', ['getVersionAsync']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatusBarComponent ],
      providers: [
        { provide: AppService, useValue: appService },
        { provide: StatusService, useValue: { status$: of(''), setStatus: () => undefined } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    appService.getVersionAsync.and.returnValue(Promise.resolve('1.2.1'));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
