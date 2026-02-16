// Create consultation endpoint (Patient only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        // Only patients can create consultations
        const user = await requireRole('PATIENT');

        const body = await request.json();
        const { chiefComplaint } = body;

        if (!chiefComplaint || chiefComplaint.trim().length === 0) {
            return NextResponse.json(
                { error: 'Chief complaint is required' },
                { status: 400 }
            );
        }

        // Check queue size (soft limit - allows small overflow under concurrency)
        const queueSize = await prisma.consultationSession.count({
            where: { status: 'WAITLISTED' }
        });

        const maxQueueSize = parseInt(process.env.MAX_QUEUE_SIZE || '50');
        if (queueSize >= maxQueueSize) {
            return NextResponse.json(
                { error: `Queue is full (${queueSize}/${maxQueueSize}). Please try again later.` },
                { status: 503 }
            );
        }

        // Create consultation with WAITLISTED status
        const consultation = await prisma.consultationSession.create({
            data: {
                patientId: user.id,
                chiefComplaint: chiefComplaint.trim(),
                status: 'WAITLISTED', // Patient enters queue
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.CREATE_CONSULTATION,
            entityType: 'ConsultationSession',
            entityId: consultation.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json(
            {
                message: 'Consultation created successfully',
                consultation,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Create consultation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
