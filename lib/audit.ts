// Audit logging utilities
import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

// Predefined action types
export enum AuditAction {
    // Authentication
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    REGISTER = 'REGISTER',

    // Consultations
    CREATE_CONSULTATION = 'CREATE_CONSULTATION',
    ASSIGN_DOCTOR = 'ASSIGN_DOCTOR',
    START_SESSION = 'START_SESSION',
    CLOSE_SESSION = 'CLOSE_SESSION',

    // Communication
    SEND_MESSAGE = 'SEND_MESSAGE',
    FLAG_MESSAGE = 'FLAG_MESSAGE',

    // Medical Records
    UPLOAD_REPORT = 'UPLOAD_REPORT',
    ACCESS_REPORT = 'ACCESS_REPORT',
    CREATE_PRESCRIPTION = 'CREATE_PRESCRIPTION',
    REVISE_PRESCRIPTION = 'REVISE_PRESCRIPTION',
    ORDER_TEST = 'ORDER_TEST',
    UPDATE_TEST = 'UPDATE_TEST',

    // Payments
    CREATE_PAYMENT = 'CREATE_PAYMENT',
    UPDATE_PAYMENT = 'UPDATE_PAYMENT',

    // Data Access
    ACCESS_MEDICAL_DATA = 'ACCESS_MEDICAL_DATA',
    ACCESS_PATIENT_HISTORY = 'ACCESS_PATIENT_HISTORY',

    // Admin
    VERIFY_DOCTOR = 'VERIFY_DOCTOR',
    DEACTIVATE_USER = 'DEACTIVATE_USER',
}

interface AuditLogData {
    userId?: string;
    action: AuditAction | string;
    entityType: string;
    entityId?: string;
    fieldNamesChanged?: string[]; // ONLY field names, NOT values
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an action to the audit trail
 * CRITICAL: Does NOT store PHI content, only metadata
 */
export async function logAction(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId || null,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId || null,
                fieldNamesChanged: data.fieldNamesChanged?.join(',') || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null,
            },
        });
    } catch (error) {
        // Log audit failures but don't block operations
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Get audit logs with pagination (admin only)
 * Returns metadata only, no PHI content
 */
export async function getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params.userId) {
        where.userId = params.userId;
    }

    if (params.action) {
        where.action = params.action;
    }

    if (params.entityType) {
        where.entityType = params.entityType;
    }

    if (params.startDate || params.endDate) {
        where.timestamp = {};
        if (params.startDate) {
            where.timestamp.gte = params.startDate;
        }
        if (params.endDate) {
            where.timestamp.lte = params.endDate;
        }
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
