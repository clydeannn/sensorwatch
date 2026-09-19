import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Single authoritative Vitest setup module for the JavaScript frontend.
//
// The app source under `src/` is plain JavaScript, so this file is the one
// implementation of the DOM setup. `setup.ts` and `setup-entry.js` are kept as
// thin re-exports only because the conversion cannot delete files; neither
// carries behavior of its own.

// Generated components use `data-ocid` markers; configure once so `getByTestId`
// resolves them rather than misdiagnosing selectors as timing failures.
configure({ testIdAttribute: "data-ocid" });

// jsdom implements neither observer, and recharts' ResponsiveContainer reads
// ResizeObserver on mount. Without a stub every chart render throws and takes
// the surrounding dashboard down with it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
}

if (!("matchMedia" in window)) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
