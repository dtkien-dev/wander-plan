import '@testing-library/jest-dom/vitest'

declare const jsdom: { window: Window }

// Node's native Web Storage must not replace the browser storage owned by jsdom.
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: jsdom.window.localStorage })
