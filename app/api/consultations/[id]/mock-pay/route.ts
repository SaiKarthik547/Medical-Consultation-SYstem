import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { ConsultationSession } from '@prisma/client';
import { waitlistQueue } from '@/lib/queue';
import { Queue } from 'bullmq';
import { cookies } from 'next/headers';

// POST /api/consultations/[id]/mock-pay - Mock payment for testing
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // Get session from cookies
        const sessionCookie = (await cookies()).get('session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionData = JSON.parse(sessionCookie.value);
        const user = sessionData.user;
        const { action } = await req.json(); // 'done' or 'cancel'

        // Check if mock payment is enabled
        if (process.env.ENABLE_MOCK_PAYMENT !== 'true') {
            return NextResponse.json({
                error: 'Mock payment is disabled. Use real payment gateway.'
            }, { status: 403 });
        }

        const consultation = await prisma.consultationSession.findUnique({
            where: { id },
            select: { patientId: true, status: true }
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        if (consultation.patientId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (action === 'done') {
            // Mark as paid - status-protected update
            const result = await prisma.$queryRaw<ConsultationSession[]>`
                UPDATE "ConsultationSession"
                SET status = 'PAID'
                WHERE id = ${id}
                  AND status = 'ACCEPTED'
                RETURNING *
            `;

            if (result.length === 0) {
                return NextResponse.json({
                    error: 'Cannot pay - consultation not in ACCEPTED status'
                }, { status: 400 });
            }

            // Create payment record
            await prisma.paymentRecord.create({
                data: {
                    consultationId: id,
                    patientId: user.id,
                    amount: 500,
                    currency: 'INR',
                    status: 'COMPLETED',
                    transactionId: `MOCK_${Date.now()}`,
                    paymentMethod: 'MOCK_PAYMENT'
                }
            });

            // Cancel the payment timeout job
            try {
                const timeoutJobId = `timeout-${id}`;
                const queue = waitlistQueue as Queue;
                await queue.remove(timeoutJobId);
                console.log(`✅ Cancelled timeout job ${timeoutJobId}`);
            } catch (error) {
                console.warn(`⚠️ Could not cancel timeout job for ${id}:`, error);
                // Non-critical - timeout worker is idempotent
            }

            // Audit log
            await prisma.auditLog.create({
                data: {
                    action: 'MOCK_PAYMENT_COMPLETED',
                    entityType: 'ConsultationSession',
                    entityId: id,
                    userId: user.id,
                    metadata: {
                        amount: 500,
                        currency: 'INR',
                        method: 'MOCK_PAYMENT'
                    }
                }
            });

            return NextResponse.json({
                success: true,
                status: 'PAID',
                message: 'Mock payment completed successfully'
            });

        } else if (action === 'cancel') {
            // Cancel payment - revert to waitlist
            const result = await prisma.$queryRaw<ConsultationSession[]>`
                UPDATE "ConsultationSession"
                SET status = 'WAITLISTED',
                    "acceptedAt" = NULL,
                    "acceptedBy" = NULL,
                    "doctorId" = NULL,
                    "paymentDueAt" = NULL
                WHERE id = ${id}
                  AND status = 'ACCEPTED'
                RETURNING *
            `;

            if (result.length === 0) {
                return NextResponse.json({
                    error: 'Cannot cancel - consultation not in ACCEPTED status'
                }, { status: 400 });
            }

            // Cancel timeout job
            try {
                const timeoutJobId = `timeout-${id}`;
                const queue = waitlistQueue as Queue;
                await queue.remove(timeoutJobId);
            } catch (error) {
                console.warn(`⚠️ Could not cancel timeout job for ${id}:`, error);
            }

            // Audit log
            await prisma.auditLog.create({
                data: {
                    action: 'PAYMENT_CANCELLED',
                    entityType: 'ConsultationSession',
                    entityId: id,
                    userId: user.id
                }
            });

            return NextResponse.json({
                success: true,
                status: 'WAITLISTED',
                message: 'Payment cancelled, returned to queue'
            });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Mock payment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
