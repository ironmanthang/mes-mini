import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    migrations: {
        path: path.join(__dirname, 'prisma', 'migrations'),
        seed: 'tsx prisma/scripts/seed.ts',
    },
    // For Supabase: use DIRECT_URL for migrations (bypasses connection pooler)
    datasource: {
        url: env('DIRECT_URL'),
    },
});
