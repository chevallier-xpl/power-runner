import { Component, EventEmitter, HostBinding, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ISettings } from 'src/app/core/models';
import { BrowseDialogService, SettingsService, StatusService } from 'src/app/core/services';

@Component({
  selector: 'pru-settings-pane',
  templateUrl: './settings-pane.component.html',
  styleUrls: ['./settings-pane.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsPaneComponent implements OnInit {
  @HostBinding('class.settings-pane') public className = true;
  public form: FormGroup = new FormGroup({
    basePath: new FormControl('', Validators.required),
    powerShellExecutable: new FormControl('', Validators.required),
    searchPaths: new FormControl('', Validators.required)
  });
  public saveError = '';

  @Output() public closed = new EventEmitter<string>();
  @Input() public set settings(value: ISettings) {
    if (value) {
      this.form.patchValue({
        basePath: value.basePath,
        powerShellExecutable: value.powerShellExecutable,
        searchPaths: value.searchPaths.join('\n')
      });
    } else {
      this.form.reset();
    }
  }

  constructor(
    private _settingsService: SettingsService,
    private _browseDialogService: BrowseDialogService,
    private _statusService: StatusService
  ) { }

  public ngOnInit(): void {
  }

  public cancel(): void {
    this.closed.emit();
  }

  public browsePowerShellExecutable(): void {
    this._browseDialogService.selectFileAsync()
      .then(file => {
        if (file) {
          this.form.patchValue({
            powerShellExecutable: file
          });
        }
      }, err => this.showError(err));
  }

  public save(): void {
    if (this.form.invalid) {
      this.showError(new Error('Complete all required settings before saving.'));
      return;
    }

    this.saveError = '';
    const value = this.form.value;
    const settings: ISettings = {
      basePath: value.basePath,
      powerShellExecutable: value.powerShellExecutable.trim(),
      searchPaths: value.searchPaths.split('\n').map(s => s.trim())
    };

    this._settingsService.saveAsync(settings)
      .then(() => this.closed.emit('saved'), err => this.showError(err));
  }

  private showError(error: Error): void {
    this.saveError = error.message;
    this._statusService.setStatus(this.saveError);
    console.error(error);
  }
}
