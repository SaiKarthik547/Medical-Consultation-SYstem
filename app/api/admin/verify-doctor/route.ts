import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';



export async function POST(request: NextRequest) {
    try {
        await requireRole('ADMIN');
        const { userId } = await request.json();

        const doctorProfile = await prisma.doctorProfile.update({
            where: { userId },
            data: {
                isVerified: true,
                verifiedAt: new Date()
            }
        });

        return NextResponse.json({ doctorProfile });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
