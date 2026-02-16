import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';



export async function GET(request: NextRequest) {
    try {
        await requireRole('ADMIN');

        const users = await prisma.user.findMany({
            include: {
                doctorProfile: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (error.name === 'ForbiddenError') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
