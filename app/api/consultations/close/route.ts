// Close consultation session (Doctor only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        const user = await requireRole('DOCTOR');

        const body = await request.json();
        const { consultationId, outcomeNotes, finalDiagnosis } = body;

        if (!consultationId) {
            return NextResponse.json(
                { error: 'Consultation ID required' },
                { status: 400 }
            );
        }

        // Verify consultation exists and doctor is assigned
        const consultation = await prisma.consultationSession.findUnique({
            where: { id: consultationId },
            include: {
                prescriptions: true,
                diagnosticTests: true,
            },
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation not found' },
                { status: 404 }
            );
        }

        if (consultation.doctorId !== user.id) {
            return NextResponse.json(
                { error: 'Not assigned to this consultation' },
                { status: 403 }
            );
        }

        if (consultation.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Can only close active consultations' },
                { status: 400 }
            );
        }

        // Close consultation
        const updatedConsultation = await prisma.consultationSession.update({
            where: { id: consultationId },
            data: {
                status: 'COMPLETED',
                endedAt: new Date(),
            },
        });

        // Create consultation snapshot for timeline optimization
        const prescriptionIds = consultation.prescriptions.map((p: any) => p.id).join(',');
        const testIds = consultation.diagnosticTests.map((t: any) => t.id).join(',');

        await prisma.consultationSnapshot.create({
            data: {
                consultationId,
                chiefComplaint: consultation.chiefComplaint,
                finalDiagnosis: finalDiagnosis || null,
                outcomeNotes: outcomeNotes || null,
                prescriptionIds,
                testIds,
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.CLOSE_SESSION,
            entityType: 'ConsultationSession',
            entityId: consultationId,
            fieldNamesChanged: ['status', 'endedAt'],
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({
            message: 'Consultation closed successfully. All data is now read-only.',
            consultation: updatedConsultation,
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Close session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
