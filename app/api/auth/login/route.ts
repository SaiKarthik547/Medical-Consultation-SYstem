// Login API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, regenerateSession } from '@/lib/auth';
import { logAction, AuditAction } from '@/lib/audit';
import { config } from '@/lib/config';
import { loginLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting (5 attempts per 15 minutes)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = loginLimiter.check(5, ip);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                doctorProfile: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account deactivated' },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Get old session token if exists
        const oldToken = request.cookies.get(config.sessionCookieName)?.value || null;

        // Regenerate session (prevents session fixation)
        const { token, csrfToken } = await regenerateSession(oldToken, user.id);

        // Set HTTP-only cookie
        const response = NextResponse.json({
            message: 'Login successful',
            csrfToken, // Client stores this for subsequent requests
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                doctorProfile: user.doctorProfile
                    ? {
                        id: user.doctorProfile.id,
                        specialization: user.doctorProfile.specialization,
                        isVerified: user.doctorProfile.isVerified,
                    }
                    : null,
            },
        });

        response.cookies.set({
            name: config.sessionCookieName,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Changed from 'lax' to 'strict' for CSRF protection
            maxAge: config.sessionExpiryDays * 24 * 60 * 60,
            path: '/',
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.LOGIN,
            entityType: 'User',
            entityId: user.id,
            ipAddress: ip,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
