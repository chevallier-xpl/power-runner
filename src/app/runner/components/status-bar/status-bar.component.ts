import { Component, DestroyRef, HostBinding, OnInit, ViewEncapsulation, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppService, StatusService } from 'src/app/core/services';

@Component({
  standalone: false,
  selector: 'pru-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StatusBarComponent implements OnInit {
  @HostBinding('class.status-bar') public className = true;
  public version: string = '';
  public status: string;

  constructor(
    private _appService: AppService,
    private _statusService: StatusService,
    private _ngZone: NgZone,
    private _destroyRef: DestroyRef
  ) { }

  public ngOnInit(): void {
    this._appService.getVersionAsync().then(version => this.version = version);
    this._statusService.status$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(s => this._ngZone.run(() => {
        this.status = s;
      }));
  }
}
