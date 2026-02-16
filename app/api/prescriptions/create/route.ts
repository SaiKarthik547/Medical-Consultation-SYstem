// Create prescription (Verified doctor only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVerifiedDoctor } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        // CRITICAL: Requires verified doctor
        const { user, doctorProfile } = await requireVerifiedDoctor();

        const body = await request.json();
        const { consultationId, medications, diagnosis, notes } = body;

        if (!consultationId || !medications || !diagnosis) {
            return NextResponse.json(
                { error: 'Consultation ID, medications, and diagnosis required' },
                { status: 400 }
            );
        }

        // Verify consultation exists, is ACTIVE, and doctor is assigned
        const consultation = await prisma.consultationSession.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation not found' },
                { status: 404 }
            );
        }

        if (consultation.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Can only prescribe during active consultations' },
                { status: 403 }
            );
        }

        if (consultation.doctorId !== user.id) {
            return NextResponse.json(
                { error: 'Not assigned to this consultation' },
                { status: 403 }
            );
        }

        // Create prescription (immutable)
        const prescription = await prisma.prescription.create({
            data: {
                consultationId,
                doctorId: user.id,
                medications: JSON.stringify(medications), // Array of {name, dosage, frequency, duration}
                diagnosis,
                notes: notes || null,
                version: 1,
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
            action: AuditAction.CREATE_PRESCRIPTION,
            entityType: 'Prescription',
            entityId: prescription.id,
            fieldNamesChanged: ['medications', 'diagnosis', 'notes'],
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json(
            {
                message: 'Prescription created successfully (immutable)',
                prescription,
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

        console.error('Create prescription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
