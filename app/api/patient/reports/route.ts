import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const user = await requireRole('PATIENT');

        const reports = await prisma.medicalReport.findMany({
            where: { patientId: user.id },
            orderBy: { uploadedAt: 'desc' }
        });

        return NextResponse.json({ reports });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
