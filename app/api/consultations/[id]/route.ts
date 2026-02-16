// Get consultation details
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, canAccessConsultation } from '@/lib/rbac';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if user can access this consultation
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Get consultation with all related data
        const consultation = await prisma.consultationSession.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        doctorProfile: {
                            select: {
                                specialization: true,
                                qualifications: true,
                            },
                        },
                    },
                },
                chatMessages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
                medicalReports: {
                    orderBy: { uploadedAt: 'desc' },
                },
                prescriptions: {
                    orderBy: { issuedAt: 'desc' },
                    include: {
                        doctor: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                diagnosticTests: {
                    orderBy: { orderedAt: 'desc' },
                    include: {
                        orderedBy: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
                snapshot: true,
            },
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            consultation,
            isReadOnly: consultation.status === 'COMPLETED' || consultation.status === 'CANCELLED',
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Get consultation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
