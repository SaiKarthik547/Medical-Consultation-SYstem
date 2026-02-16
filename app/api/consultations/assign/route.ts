import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function POST(request: NextRequest) {
    try {
        await requireRole('ADMIN');
        const { consultationId, doctorEmail } = await request.json();

        // Find doctor by email (since we are inputting email in the prompt)
        const doctor = await prisma.user.findUnique({
            where: { email: doctorEmail },
            include: { doctorProfile: true }
        });

        if (!doctor || doctor.role !== 'DOCTOR') {
            return NextResponse.json(
                { error: 'Doctor not found or invalid user' },
                { status: 400 }
            );
        }

        if (!doctor.doctorProfile?.isVerified) {
            return NextResponse.json(
                { error: 'Doctor is not verified' },
                { status: 400 }
            );
        }

        const consultation = await prisma.consultationSession.update({
            where: { id: consultationId },
            data: {
                doctorId: doctor.id,
                status: 'ACCEPTED',
                assignedAt: new Date(),
            },
        });

        return NextResponse.json({ consultation });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
