import { Component, DestroyRef, HostBinding, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SaveAsType } from 'src/app/core/models';
import { IAddProfileData } from './iadd-profile-data';

@Component({
  standalone: false,
  selector: 'pru-add-profile-dialog',
  templateUrl: './add-profile-dialog.component.html',
  styleUrls: ['./add-profile-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddProfileDialogComponent implements OnInit {
  @HostBinding('class.add-profile-dialog') public className = true;

  public hasExistingName = false;

  public form = new FormGroup({
    title: new FormControl(''),
    name: new FormControl('', Validators.required),
    saveAsType: new FormControl('', Validators.required),
  });

  constructor(
    public dialogRef: MatDialogRef<AddProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IAddProfileData,
    private _destroyRef: DestroyRef
  ) { }

  public ngOnInit(): void {
    this.form.patchValue(this.data.profile);
    this.form.get('name').valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(name => this.updateHasExistingName(name, this.form.value.saveAsType as SaveAsType));

    this.form.get('saveAsType').valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(saveAsType => this.updateHasExistingName(this.form.value.name, saveAsType as SaveAsType));
  }
  public add(): void {
    if (this.form.valid && !this.hasExistingName) {
      this.dialogRef.close(this.form.value);
    }
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  private updateHasExistingName(name: string, saveAsType: SaveAsType): void {
    this.hasExistingName = !!this.data.existingProfiles
      .find(p => p.saveAsType === saveAsType && p.name.toLowerCase() === name.toLowerCase());
  }
}
