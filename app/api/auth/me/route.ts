// Get current user session
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Unauthorized' },
            { status: 401 }
        );
    }
}
