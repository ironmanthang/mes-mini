/**
 * Jest Global Setup — runs ONCE before all test suites.
 *
 * WHY this exists:
 *   Running `npm run test` inside the Docker container needs a clean, known
 *   database state. This script automates what used to be a manual 2-step
 *   process: `prisma migrate reset --force` + `prisma db seed`.
 *
 * HOW it works:
 *   Jest runs this file in a separate Node process before any test file is
 *   loaded. It shells out to the Prisma CLI using the same environment
 *   variables that the running container already has.
 *
 * NOTE: This runs INSIDE the Docker container (same process as the test runner).
 *   It is NOT calling docker exec from the outside.
 */
import { execSync } from 'child_process';
import pg from 'pg';

export default async function globalSetup(): Promise<void> {
    console.log('\n🔄 [Global Setup] Ensuring test database exists...');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }

    try {
        const testUrl = new URL(databaseUrl);
        const testDbName = testUrl.pathname.replace(/^\//, ''); // e.g. "mydatabase_test"
        
        // Connect to the development/original database to create the test database
        const devDbName = testDbName.endsWith('_test') ? testDbName.slice(0, -5) : 'postgres';
        const adminUrl = new URL(databaseUrl);
        adminUrl.pathname = '/' + devDbName;

        const client = new pg.Client({ connectionString: adminUrl.toString() });
        await client.connect();
        
        try {
            const dbCheck = await client.query(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                [testDbName]
            );
            if (dbCheck.rowCount === 0) {
                console.log(`🔨 [Global Setup] Database "${testDbName}" does not exist. Creating it...`);
                // Note: CREATE DATABASE cannot be parameterized, so we interpolate it inside double quotes safely.
                await client.query(`CREATE DATABASE "${testDbName}"`);
                console.log(`✅ [Global Setup] Database "${testDbName}" created successfully.`);
            } else {
                console.log(`ℹ️ [Global Setup] Database "${testDbName}" already exists.`);
            }
        } finally {
            await client.end();
        }

    } catch (error) {
        console.error('❌ [Global Setup] Failed to ensure test database exists:', error);
        throw error;
    }

    console.log('🔄 [Global Setup] Resetting database and re-seeding...');

    try {
        // Step 1: Wipe all tables and re-run migrations from scratch
        execSync('npx prisma migrate reset --force', {
            stdio: 'inherit',
            env: process.env,
        });

        // Step 2: Re-seed with the standard dev seed script
        execSync('npx prisma db seed', {
            stdio: 'inherit',
            env: process.env,
        });

        console.log('✅ [Global Setup] Database ready. Starting tests...\n');
    } catch (error) {
        console.error('❌ [Global Setup] Failed to reset/seed database:', error);
        // Throwing here aborts the entire test run immediately — correct behavior.
        throw error;
    }
}
