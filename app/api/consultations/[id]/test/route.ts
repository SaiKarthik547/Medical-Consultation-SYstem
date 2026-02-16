import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, canAccessConsultation } from '@/lib/rbac';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireRole('DOCTOR');
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { testName, instructions } = await request.json();

        const test = await prisma.diagnosticTest.create({
            data: {
                consultationId: id,
                orderedById: user.id,
                testName,
                instructions,
                status: 'ORDERED'
            }
        });

        return NextResponse.json({ test });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
