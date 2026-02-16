import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

// GET /api/consultations/queue - Doctor views waitlist
export async function GET(req: NextRequest) {
    try {
        const user = await requireRole('DOCTOR');

        if (user.role !== 'DOCTOR') {
            return NextResponse.json({ error: 'Forbidden - Doctors only' }, { status: 403 });
        }

        // Fetch all waitlisted consultations ordered by createdAt (FIFO)
        const queue = await prisma.consultationSession.findMany({
            where: { status: 'WAITLISTED' },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        dateOfBirth: true,
                        gender: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Add dynamic queue position (computed, not stored)
        const queueWithPosition = queue.map((consultation: any, index: number) => ({
            ...consultation,
            queuePosition: index + 1,
            waitTime: Math.floor((Date.now() - new Date(consultation.createdAt).getTime()) / 1000 / 60) // minutes
        }));

        return NextResponse.json({
            queue: queueWithPosition,
            totalInQueue: queue.length
        });

    } catch (error) {
        console.error('Queue fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
