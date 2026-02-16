import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');

        let whereClause: any = {};

        // Role-based filtering
        if (user.role === 'PATIENT') {
            whereClause.patientId = user.id;
        } else if (user.role === 'DOCTOR') {
            whereClause.doctorId = user.id;
        } else if (user.role === 'ADMIN') {
            // Admins can filter by status, default to all if not specified
            // But for dashboard we usually want PENDING
            if (status) {
                whereClause.status = status;
            }
        }

        const consultations = await prisma.consultationSession.findMany({
            where: whereClause,
            include: {
                patient: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                doctor: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ consultations });
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
