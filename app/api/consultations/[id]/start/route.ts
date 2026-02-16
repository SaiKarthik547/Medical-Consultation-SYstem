import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, canAccessConsultation } from '@/lib/rbac';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireRole('DOCTOR');
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const consultation = await prisma.consultationSession.findUnique({
            where: { id },
            include: { payments: true }
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (consultation.status === 'ACTIVE') {
            return NextResponse.json({ message: 'Already active' });
        }

        // Queue workflow: must be PAID before starting
        if (consultation.status !== 'PAID') {
            return NextResponse.json({
                error: 'Consultation must be paid before starting. Current status: ' + consultation.status
            }, { status: 400 });
        }

        // Verify payment exists
        const hasPaidPayment = consultation.payments.some((p: any) => p.status === 'COMPLETED');
        if (!hasPaidPayment) {
            return NextResponse.json({
                error: 'No completed payment found for this consultation'
            }, { status: 400 });
        }

        // Start Session
        await prisma.consultationSession.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                startedAt: new Date()
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'SESSION_STARTED',
                entityType: 'ConsultationSession',
                entityId: id,
                userId: user.id
            }
        });

        return NextResponse.json({ status: 'ACTIVE' });

    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
