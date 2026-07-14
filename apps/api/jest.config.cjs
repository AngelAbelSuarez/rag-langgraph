const path = require('path');

/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: path.resolve(__dirname, 'tsconfig.test.json'),
      diagnostics: false,
    }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: path.resolve(__dirname, 'coverage'),
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@rag/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};

module.exports = config;
