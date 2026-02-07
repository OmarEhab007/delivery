module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  setupFilesAfterEnv: ['./tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/docs/**',
    '!src/scripts/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/docs/',
    '/src/scripts/',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
