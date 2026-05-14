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
    forceExit: true,       // Force exit after tests (closes DB connections)
    detectOpenHandles: true,

    // ── Test Isolation Config ──────────────────────────────────────────────────
    // Run all test files sequentially to prevent race conditions where two
    // test suites try to create records with the same unique code.
    // --runInBand is passed via the CLI in package.json scripts.

    // Increase timeout for beforeAll blocks that perform Prisma DB writes.
    testTimeout: 30000,

    // Wipe and re-seed the database once before all test suites run.
    // This ensures every `npm run test` starts from a clean, known state.
    globalSetup: './tests/setup/globalSetup.ts',
};

