/**
 * Test Setup Configuration
 * Configures DOM environment for React component testing
 */

import { beforeAll, afterAll } from "bun:test";
import { installCustomMatchers } from "./helpers/test-matchers";

// Mock Next.js environment variables
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true
  });
}
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Setup DOM environment for React testing
beforeAll(() => {
  // Install custom test matchers
  installCustomMatchers();
  // Set up DOM environment using happy-dom (faster than jsdom)
  const { Window } = require("happy-dom");
  const window = new Window();
  const document = window.document;

  // Set global variables that React Testing Library expects
  global.window = window as any;
  global.document = document as any;
  global.navigator = window.navigator;
  global.HTMLElement = window.HTMLElement;
  global.Element = window.Element;
  global.Node = window.Node;
  global.localStorage = window.localStorage;
  global.sessionStorage = window.sessionStorage;

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(cb, 16);
  };
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_element: Element) {}
    unobserve(_element: Element) {}
    disconnect() {}
  } as any;

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    root = null;
    rootMargin = '0px';
    thresholds = [0];
    
    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}
    observe(_element: Element) {}
    unobserve(_element: Element) {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  } as any;
});

afterAll(() => {
  // Clean up
  if (global.window) {
    global.window.close();
  }
});
