/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["utils"],
  testPathIgnorePatterns: [".d.ts", ".js"],
  setupFilesAfterEnv: ['./jest.setup.js'],
};