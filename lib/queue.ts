import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create Redis connection for BullMQ
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
});

// Notification queue for sending emails/SMS
export const notificationQueue = new Queue('notifications', {
    connection: redisConnection as any, // Type assertion for BullMQ compatibility
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

// Waitlist queue for managing consultation queue
export const waitlistQueue = new Queue('waitlist', {
    connection: redisConnection as any, // Type assertion for BullMQ compatibility
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600,
        },
    },
});

// Add job to notification queue
export async function sendNotification(data: {
    userId: string;
    type: 'EMAIL' | 'SMS';
    template: string;
    data: Record<string, any>;
}) {
    await notificationQueue.add('send-notification', data, {
        priority: data.type === 'SMS' ? 1 : 2, // SMS has higher priority
    });
}

// Add job to waitlist queue
export async function processWaitlistUpdate(data: {
    consultationId: string;
    action: 'ADD' | 'REMOVE' | 'CALL_NEXT';
}) {
    await waitlistQueue.add('waitlist-update', data);
}
