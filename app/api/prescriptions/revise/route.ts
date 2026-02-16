// Revise prescription (creates new version)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVerifiedDoctor } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        const { user } = await requireVerifiedDoctor();

        const body = await request.json();
        const { prescriptionId, medications, diagnosis, notes } = body;

        if (!prescriptionId || !medications || !diagnosis) {
            return NextResponse.json(
                { error: 'Prescription ID, medications, and diagnosis required' },
                { status: 400 }
            );
        }

        // Get original prescription
        const originalPrescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: { consultation: true },
        });

        if (!originalPrescription) {
            return NextResponse.json(
                { error: 'Prescription not found' },
                { status: 404 }
            );
        }

        // Verify doctor is assigned to consultation
        if (originalPrescription.consultation.doctorId !== user.id) {
            return NextResponse.json(
                { error: 'Not authorized to revise this prescription' },
                { status: 403 }
            );
        }

        // Create new version (original remains immutable)
        const newPrescription = await prisma.prescription.create({
            data: {
                consultationId: originalPrescription.consultationId,
                doctorId: user.id,
                medications: JSON.stringify(medications),
                diagnosis,
                notes: notes || null,
                version: originalPrescription.version + 1,
                previousVersionId: prescriptionId,
            },
            include: {
                doctor: {
                    select: {
                        name: true,
                        doctorProfile: {
                            select: {
                                specialization: true,
                                registrationNumber: true,
                            },
                        },
                    },
                },
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.REVISE_PRESCRIPTION,
            entityType: 'Prescription',
            entityId: newPrescription.id,
            fieldNamesChanged: ['medications', 'diagnosis', 'notes', 'version'],
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({
            message: `Prescription revised. New version ${newPrescription.version} created. Original preserved.`,
            prescription: newPrescription,
            previousVersion: originalPrescription.version,
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Revise prescription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
