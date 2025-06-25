/**
 * 🧪 Test Setup Configuration
 * กำหนดค่า DOM environment และ global mocks สำหรับการทดสอบ
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

// Mock DOM environment for React Testing Library
import { Window } from "happy-dom";

// Setup DOM environment before tests
beforeAll(() => {
  const window = new Window();
  const document = window.document;

  // Set globals
  global.window = window as any;
  global.document = document as any;
  global.navigator = window.navigator as any;
  global.HTMLElement = window.HTMLElement as any;
  global.Element = window.Element as any;
  global.Node = window.Node as any;
  global.Text = window.Text as any;
  global.DocumentFragment = window.DocumentFragment as any;
  global.location = window.location as any;

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    length: 0,
    key: (index: number) => null,
  };
  global.localStorage = localStorageMock;
  global.sessionStorage = localStorageMock;

  // Mock fetch if not already mocked
  if (!global.fetch) {
    global.fetch = (() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)) as any;
  }

  // Mock URL constructor
  global.URL = window.URL as any;
  global.URLSearchParams = window.URLSearchParams as any;

  // Mock scrollTo
  global.scrollTo = () => {};
  if (window.scrollTo) window.scrollTo = () => {};

  // Mock console methods to avoid noise in tests
  global.console = {
    ...console,
    log: () => {},
    warn: () => {},
    info: () => {},
  };
});

// Cleanup after each test
afterEach(() => {
  // Clear document body
  if (document?.body) {
    document.body.innerHTML = "";
  }
});

// Cleanup after all tests
afterAll(() => {
  // Cleanup globals
  delete (global as any).window;
  delete (global as any).document;
  delete (global as any).navigator;
});

// Export for use in other test files
export {};
