// Get chat history for consultation
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessConsultation } from '@/lib/rbac';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    try {
        const { consultationId } = await params;

        // Check access permissions
        const canAccess = await canAccessConsultation(consultationId);

        if (!canAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Get ALL messages (including flagged ones)
        // CRITICAL: Messages are NEVER deleted or hidden
        const messages = await prisma.chatMessage.findMany({
            where: { consultationId },
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
        });

        return NextResponse.json({
            messages,
            note: 'All messages shown. flaggedForReview indicates moderation flag only.',
        });
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Get chat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
