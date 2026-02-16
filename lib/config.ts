// Application configuration and constants
export const config = {
    // Session
    sessionExpiryDays: 7,
    sessionCookieName: 'session',

    // File uploads
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: {
        reports: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    },
    uploadDir: './uploads/reports',

    // Rate limiting
    rateLimits: {
        login: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxAttempts: 5,
        },
        api: {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100,
        },
    },

    // Consultation
    consultationTimeoutHours: 24, // Auto-close after 24 hours of inactivity

    // Pagination
    defaultPageSize: 20,
    maxPageSize: 100,

    // Patient consent
    currentConsentVersion: 'v1.0.0',
    consentText: `
I hereby consent to participate in this online medical consultation.
I understand that:
1. This consultation is confidential and protected by medical privacy laws
2. All communication will be recorded and stored securely
3. My doctor may prescribe medications or order diagnostic tests
4. I have the right to end this consultation at any time
5. All access to my medical data is logged and legally auditable
  `.trim(),
};

export type Config = typeof config;
