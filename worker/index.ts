import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { waitlistQueue, notificationQueue } from '../lib/queue';
import { Prisma, ConsultationSession } from '@prisma/client';

// Create Redis connection for BullMQ workers
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
});

// Notification worker - sends emails/SMS
export const notificationWorker = new Worker(
    'notifications',
    async (job) => {
        const { userId, type, template, data } = job.data;

        console.log(`📧 Sending ${type} notification to user ${userId}`);
        console.log(`Template: ${template}`, data);

        // TODO: Integrate with real email/SMS service (SendGrid, Twilio, etc.)
        // For now, log the notification

        // Log notification in database (using existing AuditLog fields)
        await prisma.auditLog.create({
            data: {
                action: `NOTIFICATION_SENT_${type}`,
                entityType: 'User',
                entityId: userId,
                userId: userId,
            },
        });

        return { success: true, userId, type };
    },
    {
        connection: redisConnection as any, // Type assertion for BullMQ compatibility
        concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    }
);

notificationWorker.on('completed', (job) => {
    console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job?.id} failed:`, err);
});

// Waitlist worker - manages consultation queue
export const waitlistWorker = new Worker(
    'waitlist',
    async (job) => {
        const { consultationId, action, doctorId, doctorName } = job.data;

        console.log(`🏥 Processing waitlist action: ${action} for consultation ${consultationId}`);

        switch (action) {
            case 'DOCTOR_ACCEPT':
                // Doctor accepts patient from queue
                // This is called from the API endpoint after atomic DB update
                // Worker handles notification dispatch
                const consultation = await prisma.consultationSession.findUnique({
                    where: { id: consultationId },
                    include: { patient: true }
                });

                if (!consultation) {
                    throw new Error('Consultation not found');
                }

                // Schedule payment timeout (delayed job - 15 minutes)
                await waitlistQueue.add('PAYMENT_TIMEOUT',
                    { consultationId },
                    { delay: 15 * 60 * 1000, jobId: `timeout-${consultationId}` }
                );

                // Send notification to patient
                await notificationQueue.add('send-notification', {
                    userId: consultation.patient.id,
                    type: 'SMS',
                    template: 'doctor-accepted',
                    data: { doctorName: doctorName || 'Doctor' }
                });

                console.log(`✅ Doctor ${doctorId} accepted consultation ${consultationId}`);
                break;

            case 'PAYMENT_TIMEOUT':
                // Revert consultation to WAITLISTED if payment not received
                // Idempotent - only reverts if still in ACCEPTED status
                await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                    const updated = await tx.$queryRaw<ConsultationSession[]>`
                        UPDATE "ConsultationSession"
                        SET status = 'WAITLISTED',
                            "acceptedAt" = NULL,
                            "acceptedBy" = NULL,
                            "paymentDueAt" = NULL
                        WHERE id = ${consultationId}
                          AND status = 'ACCEPTED'
                        RETURNING *
                    `;

                    if (updated.length > 0) {
                        const reverted = updated[0];
                        console.log(`⏰ Payment timeout - reverted consultation ${consultationId} to WAITLISTED`);

                        // Notify patient
                        await notificationQueue.add('send-notification', {
                            userId: reverted.patientId,
                            type: 'SMS',
                            template: 'payment-timeout',
                            data: {}
                        });

                        // Audit log
                        await tx.auditLog.create({
                            data: {
                                action: 'PAYMENT_TIMEOUT_REVERTED',
                                entityType: 'ConsultationSession',
                                entityId: consultationId,
                                userId: reverted.patientId,
                                metadata: {
                                    reason: 'Payment not received within 15 minutes'
                                }
                            }
                        });
                    } else {
                        console.log(`ℹ️ Payment timeout ignored - consultation ${consultationId} already paid or cancelled`);
                    }
                });
                break;

            case 'REMOVE':
                // Cancel consultation
                await prisma.consultationSession.update({
                    where: { id: consultationId },
                    data: { status: 'CANCELLED' },
                });
                console.log(`❌ Consultation ${consultationId} cancelled`);
                break;

            default:
                console.warn(`Unknown waitlist action: ${action}`);
        }

        return { success: true, consultationId, action };
    },
    {
        connection: redisConnection as any, // Type assertion for BullMQ compatibility
        concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    }
);

waitlistWorker.on('completed', (job) => {
    console.log(`✅ Waitlist job ${job.id} completed`);
});

waitlistWorker.on('failed', (job, err) => {
    console.error(`❌ Waitlist job ${job?.id} failed:`, err);
});

// Worker heartbeat for health monitoring
setInterval(async () => {
    await redisConnection.set('worker:heartbeat', Date.now().toString(), 'EX', 30);
}, 10000);

console.log('🚀 Workers started');
