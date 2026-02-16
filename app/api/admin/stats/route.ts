import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';



export async function GET(request: NextRequest) {
    try {
        // Only admins can see system stats
        await requireRole('ADMIN');

        const totalUsers = await prisma.user.count();

        const verifiedDoctors = await prisma.user.count({
            where: {
                role: 'DOCTOR',
                doctorProfile: {
                    isVerified: true,
                },
            },
        });

        const pendingConsultations = await prisma.consultationSession.count({
            where: {
                status: 'WAITLISTED',
            },
        });

        return NextResponse.json({
            stats: {
                totalUsers,
                verifiedDoctors,
                pendingConsultations,
            },
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.name === 'ForbiddenError') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
