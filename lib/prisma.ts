import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Slow query logging using $extends (Prisma 5.x compatible)
export const prismaWithLogging = prisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ operation, model, args, query }: {
                operation: string;
                model: string;
                args: any;
                query: (args: any) => Promise<any>;
            }) {
                const start = Date.now();
                const result = await query(args);
                const duration = Date.now() - start;

                if (duration > 500) {
                    console.warn(`⚠️ Slow query: ${model}.${operation} took ${duration}ms`);
                }

                return result;
            },
        },
    },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
});
