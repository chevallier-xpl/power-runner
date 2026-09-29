if (!(window as any).proxyApi) {
  (window as any).proxyApi = {
    receive: () => undefined,
    send: () => undefined
  };
}
