import dotenv from 'dotenv';
dotenv.config();

// If DATABASE_URL is not defined (e.g. running on local host instead of docker), construct it
if (!process.env.DATABASE_URL) {
    const user = process.env.POSTGRES_USER || 'user';
    const password = process.env.POSTGRES_PASSWORD || 'Th1s_is_a_V3ry-S3cur3-P4ss';
    const host = 'localhost';
    const port = process.env.DB_PORT || '5432';
    const db = process.env.POSTGRES_DB || 'mydatabase';
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
}

// If R2 configuration is missing (e.g. running on local host instead of docker), construct it
if (!process.env.R2_ENDPOINT) {
    process.env.R2_ENDPOINT = 'http://localhost:9000';
}
if (!process.env.R2_PUBLIC_ENDPOINT) {
    process.env.R2_PUBLIC_ENDPOINT = 'http://localhost:9000';
}
if (!process.env.R2_ACCESS_KEY_ID) {
    process.env.R2_ACCESS_KEY_ID = process.env.MINIO_ROOT_USER || 'minioadmin';
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
    process.env.R2_SECRET_ACCESS_KEY = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
}
if (!process.env.R2_BUCKET_NAME) {
    process.env.R2_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'lite-mes';
}

const getTestUrl = (originalUrl) => {
    if (!originalUrl) return originalUrl;
    try {
        const url = new URL(originalUrl);
        if (!url.pathname.endsWith('_test')) {
            url.pathname = url.pathname + '_test';
        }
        return url.toString();
    } catch (e) {
        return originalUrl;
    }
};

process.env.DATABASE_URL = getTestUrl(process.env.DATABASE_URL);
process.env.DIRECT_URL = getTestUrl(process.env.DIRECT_URL);

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

