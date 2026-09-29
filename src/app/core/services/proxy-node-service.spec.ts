import { ProxyNodeService } from './proxy-node-service';
import { NodeProxy } from '../models';

class TestProxyNodeService extends ProxyNodeService {
  public get initializedProxy(): NodeProxy {
    return this.proxy;
  }

  constructor() {
    super('test-service');
  }
}

describe('ProxyNodeService', () => {
  it('should expose the configured service name and initialized proxy', () => {
    const service = new TestProxyNodeService();
    const proxy = new NodeProxy();

    service.initialize(proxy);

    expect(service).toBeTruthy();
    expect(service.name).toBe('test-service');
    expect(service.initializedProxy).toBe(proxy);
  });
});
