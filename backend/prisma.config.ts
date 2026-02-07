import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
    datasource: {
        url
    },
    migrations: {
        seed: 'tsx prisma/scripts/seed.ts'
    }
});
