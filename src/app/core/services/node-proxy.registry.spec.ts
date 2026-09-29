import { TestBed } from '@angular/core/testing';

import { NodeProxyRegistry } from './node-proxy.registry';

describe('NodeProxyRegistry', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service = TestBed.inject(NodeProxyRegistry);
    expect(service).toBeTruthy();
  });
});
