/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.spec.[jt]s"],
  coverageReporters: ["clover", "json", "lcov", "text", "json-summary"],
  coverageDirectory: "coverage",
};
