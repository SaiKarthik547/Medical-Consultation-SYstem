// Registration API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logAction, AuditAction } from '@/lib/audit';

// UserRole type from Prisma schema
type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, phone, role, registrationNumber, specialization, qualifications } = body;

        // Validation
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength (min 8 chars)
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['PATIENT', 'DOCTOR', 'ADMIN'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userData: any = {
            email,
            password: hashedPassword,
            name,
            phone: phone || null,
            role: role as UserRole,
        };

        // If doctor, create doctor profile
        if (role === 'DOCTOR') {
            if (!registrationNumber || !specialization) {
                return NextResponse.json(
                    { error: 'Registration number and specialization required for doctors' },
                    { status: 400 }
                );
            }

            // Check if registration number already exists
            const existingDoctor = await prisma.doctorProfile.findUnique({
                where: { registrationNumber },
            });

            if (existingDoctor) {
                return NextResponse.json(
                    { error: 'Registration number already in use' },
                    { status: 409 }
                );
            }

            userData.doctorProfile = {
                create: {
                    registrationNumber,
                    specialization,
                    qualifications: qualifications || '',
                    isVerified: false, // Doctors start unverified
                },
            };
        }

        const user = await prisma.user.create({
            data: userData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.REGISTER,
            entityType: 'User',
            entityId: user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json(
            {
                message: 'Registration successful',
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
