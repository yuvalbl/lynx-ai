module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  // Map TypeScript path aliases to JS paths
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    // Map the directory itself to index.ts
    '^@scenario-parser/interfaces$': '<rootDir>/src/scenario-parser/interfaces/index.ts',
    // Map files within the directory
    '^@scenario-parser/interfaces/(.*)$': '<rootDir>/src/scenario-parser/interfaces/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}; 