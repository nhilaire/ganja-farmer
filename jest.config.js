// Jest: unit tests for pure game logic + component tests (React Native Testing Library).
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  // Full-app renders exceed the 5 s default when the emulator loads the machine during verify.
  testTimeout: 30000,
  // The music track is local-only (metro.config.js); tests use a stand-in asset id.
  moduleNameMapper: { '^ganja-farmer-local-music$': '<rootDir>/src/test-utils/musicAsset.js' },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/android/', '<rootDir>/ios/'],
};
