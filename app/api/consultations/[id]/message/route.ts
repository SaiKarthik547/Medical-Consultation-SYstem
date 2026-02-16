import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessConsultation, requireAuth } from '@/lib/rbac';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireAuth();
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { message } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        // Verify consultation exists and get payment status
        const consultation = await prisma.consultationSession.findUnique({
            where: { id },
            include: {
                payments: true,
                patient: { select: { id: true } }
            }
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // CRITICAL: Patients must pay before chatting with doctor
        if (user.role === 'PATIENT') {
            const hasPaid = consultation.payments.some((p: any) => p.status === 'COMPLETED');
            if (!hasPaid) {
                return NextResponse.json({
                    error: 'Payment required before consultation. Please complete payment to continue.'
                }, { status: 402 }); // 402 Payment Required
            }
        }

        const chatMessage = await prisma.chatMessage.create({
            data: {
                consultationId: id,
                senderId: user.id,
                message: message.trim(),
            },
            include: {
                sender: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // AUDIT LOG: Record all chat messages for legal compliance
        await prisma.auditLog.create({
            data: {
                action: 'CHAT_MESSAGE_SENT',
                entityType: 'ChatMessage',
                entityId: chatMessage.id,
                userId: user.id,
                metadata: {
                    consultationId: id,
                    messageLength: message.trim().length,
                    senderRole: user.role,
                    patientId: consultation.patient.id,
                    hasPaid: consultation.payments.some((p: any) => p.status === 'COMPLETED'),
                    timestamp: new Date().toISOString()
                }
            }
        });

        // Update consultation updated at
        await prisma.consultationSession.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ message: chatMessage });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
