import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, canAccessConsultation } from '@/lib/rbac';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireRole('DOCTOR'); // Only doctors prescribe
        const canAccess = await canAccessConsultation(id);

        if (!canAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { medications, diagnosis, notes } = await request.json();

        const prescription = await prisma.prescription.create({
            data: {
                consultationId: id,
                doctorId: user.id,
                medications: JSON.stringify(medications), // Assuming JSON array
                diagnosis,
                notes,
                version: 1
            }
        });

        return NextResponse.json({ prescription });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
