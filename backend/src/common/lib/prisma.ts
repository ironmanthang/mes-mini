import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../../generated/prisma/index.js';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
});

export default prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
