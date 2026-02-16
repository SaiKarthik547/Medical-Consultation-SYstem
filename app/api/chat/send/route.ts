// Send chat message
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';



export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        const body = await request.json();
        const { consultationId, message } = body;

        if (!consultationId || !message || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Consultation ID and message required' },
                { status: 400 }
            );
        }

        // Verify consultation exists and is ACTIVE
        const consultation = await prisma.consultationSession.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation not found' },
                { status: 404 }
            );
        }

        // CRITICAL: Chat only allowed during ACTIVE sessions
        if (consultation.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Chat only allowed during active consultations' },
                { status: 403 }
            );
        }

        // Verify user is patient or assigned doctor
        const isPatient = user.id === consultation.patientId;
        const isDoctor = user.id === consultation.doctorId;

        if (!isPatient && !isDoctor) {
            return NextResponse.json(
                { error: 'Not authorized for this consultation' },
                { status: 403 }
            );
        }

        // Create append-only chat message
        const chatMessage = await prisma.chatMessage.create({
            data: {
                consultationId,
                senderId: user.id,
                message: message.trim(),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.SEND_MESSAGE,
            entityType: 'ChatMessage',
            entityId: chatMessage.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({
            message: 'Message sent',
            chatMessage,
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Send message error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
