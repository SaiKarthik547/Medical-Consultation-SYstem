import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, canAccessConsultation } from '@/lib/rbac';
import crypto from 'crypto';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireRole('PATIENT');
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            // Log unauthorized attempt?
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Atomic payment processing to prevent race conditions
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Get payment record within transaction
            const payment = await tx.paymentRecord.findFirst({
                where: { consultationId: id }
            });

            // Idempotency Check
            if (payment && payment.status === 'COMPLETED') {
                await tx.auditLog.create({
                    data: {
                        action: 'DUPLICATE_PAYMENT_ATTEMPT',
                        entityType: 'PaymentRecord',
                        entityId: payment.id,
                        userId: user.id
                    }
                });
                return { alreadyPaid: true, paymentId: payment.id };
            }

            // Get consultation to determine amount
            const consultation = await tx.consultationSession.findUnique({
                where: { id },
            });

            if (!consultation) {
                throw new Error('Consultation not found');
            }

            // Create or update payment record
            let paymentId: string;
            let transactionId: string;

            // If payment record doesn't exist, create it
            if (!payment) {
                // In production: Create Stripe payment intent
                // const paymentIntent = await createPaymentIntent(
                //   50000, // $500 in cents
                //   id,
                //   user.id
                // );
                // transactionId = paymentIntent.id;

                // For now, generate transaction ID
                transactionId = `pi_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

                const newPayment = await tx.paymentRecord.create({
                    data: {
                        consultationId: id,
                        patientId: user.id,
                        amount: 500,
                        status: 'COMPLETED',
                        transactionId,
                    }
                });
                paymentId = newPayment.id;
            } else {
                // Update existing payment
                transactionId = `pi_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

                await tx.paymentRecord.update({
                    where: { id: payment.id },
                    data: {
                        status: 'COMPLETED',
                        transactionId,
                        updatedAt: new Date()
                    }
                });
                paymentId = payment.id;
            }

            await tx.auditLog.create({
                data: {
                    action: 'PAYMENT_COMPLETED',
                    entityType: 'PaymentRecord',
                    entityId: paymentId,
                    userId: user.id
                }
            });

            return { alreadyPaid: false, paymentId, transactionId };
        });

        if (result.alreadyPaid) {
            return NextResponse.json({ message: 'Payment already completed', status: 'COMPLETED' });
        }

        return NextResponse.json({
            status: 'COMPLETED',
            transactionId: result.transactionId,
        });


    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
