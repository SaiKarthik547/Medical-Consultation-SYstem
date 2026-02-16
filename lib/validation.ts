import validator from 'validator';
import sanitizeHtml from 'sanitize-html';

export function validateEmail(email: string): boolean {
    return validator.isEmail(email);
}

export function validatePhone(phone: string): boolean {
    // E.164 format or empty
    return !phone || validator.isMobilePhone(phone, 'any');
}

export interface PasswordValidation {
    valid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (password.length < 8) errors.push('At least 8 characters required');
    if (password.length > 64) errors.push('Maximum 64 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
    if (!/[0-9]/.test(password)) errors.push('At least one number required');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character required');

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function sanitizeInput(input: string): string {
    // Use sanitize-html library (NOT homegrown)
    return sanitizeHtml(input, {
        allowedTags: [], // Strip all HTML
        allowedAttributes: {},
    });
}

export function validateStringLength(
    str: string,
    min: number,
    max: number
): boolean {
    const length = str.trim().length;
    return length >= min && length <= max;
}
