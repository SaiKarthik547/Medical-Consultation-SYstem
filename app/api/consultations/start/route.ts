// Start consultation session (Doctor only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVerifiedDoctor } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
    try {
        // Requires verified doctor
        const { user, doctorProfile } = await requireVerifiedDoctor();

        const body = await request.json();
        const { consultationId } = body;

        if (!consultationId) {
            return NextResponse.json(
                { error: 'Consultation ID required' },
                { status: 400 }
            );
        }

        // Verify consultation exists, is ASSIGNED, and assigned to this doctor
        const consultation = await prisma.consultationSession.findUnique({
            where: { id: consultationId },
            include: {
                patient: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation not found' },
                { status: 404 }
            );
        }

        if (consultation.status !== 'PAID') {
            return NextResponse.json(
                { error: 'Consultation must be in ASSIGNED status' },
                { status: 400 }
            );
        }

        if (consultation.doctorId !== user.id) {
            return NextResponse.json(
                { error: 'Not assigned to this consultation' },
                { status: 403 }
            );
        }

        // Get IP address for consent tracking
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Create patient consent record
        await prisma.patientConsent.create({
            data: {
                consultationId,
                consentTextVersion: config.currentConsentVersion,
                ipAddress,
                userAgent,
            },
        });

        // Update consultation to ACTIVE
        const updatedConsultation = await prisma.consultationSession.update({
            where: { id: consultationId },
            data: {
                status: 'ACTIVE',
                startedAt: new Date(),
                consentGivenAt: new Date(),
                consentIpAddress: ipAddress,
            },
            include: {
                patient: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                doctor: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.START_SESSION,
            entityType: 'ConsultationSession',
            entityId: consultationId,
            fieldNamesChanged: ['status', 'startedAt', 'consentGivenAt', 'consentIpAddress'],
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            message: 'Consultation session started successfully',
            consultation: updatedConsultation,
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Start session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
