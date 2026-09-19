// Type augmentation plus compatibility re-export.
//
// The app source is plain JavaScript, so the Vitest DOM setup lives in
// `setup.js`. This file is retained because the TypeScript program needs the
// `@testing-library/jest-dom/vitest` matcher augmentation to be declared from a
// `.ts` file: `checkJs` is off, so an augmentation inside `setup.js` would not
// reach the `.tsx` test files. The runtime behavior is imported from the single
// implementation.
import "@testing-library/jest-dom/vitest";
import "./setup.js";
