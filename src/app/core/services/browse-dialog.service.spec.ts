import { TestBed } from '@angular/core/testing';

import { BrowseDialogService } from './browse-dialog.service';

describe('BrowseDialogService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service = TestBed.inject(BrowseDialogService);
    expect(service).toBeTruthy();
  });
});
