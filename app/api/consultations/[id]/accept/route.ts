import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import IORedis from 'ioredis';
import { ConsultationSession } from '@prisma/client';
import { waitlistQueue } from '@/lib/queue';

// Redis for rate limiting
const redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
});

// POST /api/consultations/[id]/accept - Doctor accepts patient from queue
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const user = await requireRole('DOCTOR');

        if (user.role !== 'DOCTOR') {
            return NextResponse.json({ error: 'Forbidden - Doctors only' }, { status: 403 });
        }

        // Rate limit check (before acceptance)
        const rateLimitKey = `doctor: accept:${user.id} `;
        const currentCount = await redis.get(rateLimitKey);

        if (parseInt(currentCount || '0') >= 5) {
            return NextResponse.json({
                error: 'Rate limit exceeded. Maximum 5 acceptances per minute.'
            }, { status: 429 });
        }

        // Increment rate limit (optimistic)
        const newCount = await redis.incr(rateLimitKey);
        if (newCount === 1) {
            await redis.expire(rateLimitKey, 60); // 1 minute expiry
        }

        try {
            // Atomic acceptance with status check
            const result = await prisma.$queryRaw<ConsultationSession[]>`
                UPDATE "ConsultationSession"
                SET status = 'ACCEPTED',
                "acceptedAt" = NOW(),
                "acceptedBy" = ${user.id},
                "doctorId" = ${user.id},
                "paymentDueAt" = NOW() + INTERVAL '15 minutes'
                WHERE id = ${id}
                  AND status = 'WAITLISTED'
                RETURNING *
            `;

            if (result.length === 0) {
                // Compensation: decrement rate limit on failure
                await redis.decr(rateLimitKey);
                return NextResponse.json({
                    error: 'Consultation already accepted by another doctor or not in queue'
                }, { status: 409 });
            }

            const consultation = result[0];

            // Dispatch worker job for notifications and timeout scheduling
            await waitlistQueue.add('DOCTOR_ACCEPT', {
                consultationId: id,
                doctorId: user.id,
                doctorName: user.name
            });

            // Audit log
            await prisma.auditLog.create({
                data: {
                    action: 'CONSULTATION_ACCEPTED',
                    entityType: 'ConsultationSession',
                    entityId: id,
                    userId: user.id,
                    metadata: {
                        patientId: consultation.patientId,
                        paymentDueAt: consultation.paymentDueAt
                    }
                }
            });

            return NextResponse.json({
                success: true,
                consultation: {
                    id: consultation.id,
                    status: consultation.status,
                    acceptedAt: consultation.acceptedAt,
                    paymentDueAt: consultation.paymentDueAt
                }
            });

        } catch (error) {
            // Compensation: decrement rate limit on error
            await redis.decr(rateLimitKey);
            throw error;
        }

    } catch (error) {
        console.error('Accept consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
