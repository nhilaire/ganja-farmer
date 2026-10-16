// Native modules are replaced by in-memory mocks so that tests run in Node.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
  setConsent: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({})),
  log: jest.fn(),
  recordError: jest.fn(),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

// Skia is native: a callable proxy stands in for every API (paints, paths, fonts), the canvas renders as a View
// and pictures are never recorded, so drawing code does not run in tests (it is proven by Maestro screenshots).
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  const stub = () => {
    const fn = () => proxy;
    const proxy = new Proxy(fn, { get: (_t, key) => (key === 'then' ? undefined : proxy), apply: () => proxy });
    return proxy;
  };
  const any = stub();
  return {
    Skia: any,
    PaintStyle: any,
    StrokeCap: any,
    BlendMode: any,
    matchFont: () => any,
    createPicture: () => ({}),
    Canvas: ({ children, style }) => React.createElement(View, { style, testID: 'skia-canvas' }, children),
    Picture: () => null,
    Path: () => null,
  };
});
