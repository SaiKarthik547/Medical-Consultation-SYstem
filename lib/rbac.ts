// Role-Based Access Control (RBAC) utilities
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from './auth';
import { prisma } from './prisma';

// UserRole type from Prisma schema
type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Get current user from session (server-side only)
 * @throws UnauthorizedError if not authenticated
 */
export async function requireAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        throw new UnauthorizedError('Not authenticated');
    }

    const session = await getSession(token);

    if (!session) {
        throw new UnauthorizedError('Invalid or expired session');
    }

    return session.user;
}

/**
 * Require specific role (STRICT enforcement)
 * @throws ForbiddenError if user doesn't have required role
 */
export async function requireRole(role: UserRole) {
    const user = await requireAuth();

    if (user.role !== role) {
        throw new ForbiddenError(`Requires ${role} role`);
    }

    return user;
}

/**
 * Check if current user can access a consultation
 * Patient can access their own consultations
 * Doctor can access assigned consultations
 * Admin CANNOT access medical content
 */
export async function canAccessConsultation(
    consultationId: string
): Promise<boolean> {
    const user = await requireAuth();

    const consultation = await prisma.consultationSession.findUnique({
        where: { id: consultationId },
    });

    if (!consultation) {
        return false;
    }

    // Patient can access their own consultations
    if (user.role === 'PATIENT' && consultation.patientId === user.id) {
        return true;
    }

    // Doctor can access assigned consultations
    if (user.role === 'DOCTOR' && consultation.doctorId === user.id) {
        return true;
    }

    // Admin cannot access medical content
    return false;
}

/**
 * Check if current user can access patient medical data
 * Used for medical reports, prescriptions, etc.
 */
export async function canAccessMedicalData(
    patientId: string,
    consultationId?: string
): Promise<boolean> {
    const user = await requireAuth();

    // Admin NEVER has access to medical content
    if (user.role === 'ADMIN') {
        return false;
    }

    // Patient can access their own data
    if (user.role === 'PATIENT' && patientId === user.id) {
        return true;
    }

    // Doctor can access if assigned to consultation
    if (user.role === 'DOCTOR' && consultationId) {
        const consultation = await prisma.consultationSession.findUnique({
            where: { id: consultationId },
        });

        if (consultation?.doctorId === user.id) {
            return true;
        }
    }

    return false;
}

/**
 * Check if current user is a verified doctor
 * CRITICAL: Used for prescription/test ordering enforcement
 * @throws ForbiddenError if not verified
 */
export async function requireVerifiedDoctor() {
    const user = await requireRole('DOCTOR');

    const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
    });

    if (!doctorProfile || !doctorProfile.isVerified) {
        throw new ForbiddenError(
            'Doctor verification required to prescribe or order tests'
        );
    }

    return { user, doctorProfile };
}

// Helper functions
export function isDoctor(role: UserRole): boolean {
    return role === 'DOCTOR';
}

export function isPatient(role: UserRole): boolean {
    return role === 'PATIENT';
}

export function isAdmin(role: UserRole): boolean {
    return role === 'ADMIN';
}
