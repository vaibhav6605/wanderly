// Jest's resolver does not honor Node's native package.json "imports"
// subpath map, so the same aliases used at runtime (see package.json
// "imports") are mirrored here for tests.
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  moduleNameMapper: {
    '^#config/(.*)$': '<rootDir>/src/config/$1',
    '^#modules/(.*)$': '<rootDir>/src/modules/$1',
    '^#middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#utils/(.*)$': '<rootDir>/src/utils/$1',
    '^#jobs/(.*)$': '<rootDir>/src/jobs/$1',
    '^#webhooks/(.*)$': '<rootDir>/src/webhooks/$1',
  },
}
