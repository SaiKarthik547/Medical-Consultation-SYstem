// Order diagnostic test (Verified doctor only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVerifiedDoctor } from '@/lib/rbac';
import { logAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        // CRITICAL: Requires verified doctor
        const { user } = await requireVerifiedDoctor();

        const body = await request.json();
        const { consultationId, testName, instructions } = body;

        if (!consultationId || !testName) {
            return NextResponse.json(
                { error: 'Consultation ID and test name required' },
                { status: 400 }
            );
        }

        // Verify consultation is ACTIVE and doctor is assigned
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
                { error: 'Can only order tests during active consultations' },
                { status: 403 }
            );
        }

        if (consultation.doctorId !== user.id) {
            return NextResponse.json(
                { error: 'Not assigned to this consultation' },
                { status: 403 }
            );
        }

        // Create diagnostic test order
        const test = await prisma.diagnosticTest.create({
            data: {
                consultationId,
                orderedById: user.id,
                testName,
                instructions: instructions || null,
                status: 'ORDERED',
            },
            include: {
                orderedBy: {
                    select: {
                        name: true,
                        doctorProfile: {
                            select: {
                                specialization: true,
                            },
                        },
                    },
                },
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.ORDER_TEST,
            entityType: 'DiagnosticTest',
            entityId: test.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json(
            {
                message: 'Diagnostic test ordered successfully',
                test,
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

        console.error('Order test error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
