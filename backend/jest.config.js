/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    reporters: [
        "default",
        ["jest-html-reporter", {
            "pageTitle": "Test Report",
            "outputPath": "./test-report.html"
        }]
    ],
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
            tsconfig: 'tsconfig.json'
        }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    silent: false,
    verbose: true,
    forceExit: true, // Force exit after tests complete (e.g. database connections)
    detectOpenHandles: true,
};
