import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
}

export function validateCsrfToken(token: string, expected: string): boolean {
    if (!token || !expected) return false;
    return token === expected;
}
