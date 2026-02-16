// Authentication and session management utilities
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateCsrfToken } from './csrf';

const SESSION_EXPIRY_DAYS = 7;
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user
 * @returns Session token and CSRF token to be stored in HTTP-only cookie and sent to client
 */
export async function createSession(userId: string): Promise<{ token: string; csrfToken: string }> {
    const token = uuidv4();
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    await prisma.session.create({
        data: {
            userId,
            token,
            csrfToken,
            expiresAt,
        },
    });

    return { token, csrfToken };
}

/**
 * Regenerate session on login to prevent session fixation
 * @returns New session token and CSRF token
 */
export async function regenerateSession(oldToken: string | null, userId: string): Promise<{ token: string; csrfToken: string }> {
    // Delete old session if exists
    if (oldToken) {
        await prisma.session.deleteMany({ where: { token: oldToken } });
    }

    // Create new session with new token
    return createSession(userId);
}

/**
 * Get session and user from token
 * @returns User object if session is valid, null otherwise
 */
export async function getSession(token: string) {
    const session = await prisma.session.findUnique({
        where: { token },
        include: {
            user: {
                include: {
                    doctorProfile: true,
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
        // Delete expired session
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    return session;
}

/**
 * Destroy a session (logout)
 */
export async function destroySession(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
}
