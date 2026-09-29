// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: any;
if (!(window as any).proxyApi) {
  (window as any).proxyApi = {
    receive: () => undefined,
    send: () => undefined
  };
}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const contexts = [
  require.context('./app', true, /\.spec\.ts$/),
  require.context('./', false, /\.spec\.ts$/)
];
// And load the modules.
contexts.forEach(context => context.keys().map(context));
