// Logout API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/auth';
import { logAction, AuditAction } from '@/lib/audit';
import { config } from '@/lib/config';
import { requireAuth } from '@/lib/rbac';

export async function POST(request: NextRequest) {
    try {
        // Get current user for audit log
        const user = await requireAuth();

        const cookieStore = await cookies();
        const token = cookieStore.get(config.sessionCookieName)?.value;

        if (token) {
            // Destroy session in database
            await destroySession(token);

            // Audit log
            await logAction({
                userId: user.id,
                action: AuditAction.LOGOUT,
                entityType: 'User',
                entityId: user.id,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            });
        }

        // Clear cookie
        const response = NextResponse.json({
            message: 'Logout successful',
        });

        response.cookies.delete(config.sessionCookieName);

        return response;
    } catch (error) {
        // Even if error, clear cookie
        const response = NextResponse.json({
            message: 'Logout successful',
        });

        response.cookies.delete(config.sessionCookieName);

        return response;
    }
}
