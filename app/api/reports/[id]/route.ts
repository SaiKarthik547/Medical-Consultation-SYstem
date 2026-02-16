// Get medical report with integrity verification
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessMedicalData, requireAuth } from '@/lib/rbac';
import { readVerifiedFile } from '@/lib/file';
import { logAction, AuditAction } from '@/lib/audit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get report
        const report = await prisma.medicalReport.findUnique({
            where: { id },
        });

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

        // Check access permissions
        const canAccess = await canAccessMedicalData(
            report.patientId,
            report.consultationId || undefined
        );

        if (!canAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Read file with integrity verification
        try {
            const fileBuffer = await readVerifiedFile(report.filePath, report.fileHash);

            // Get current user for audit log
            const user = await requireAuth();

            // Audit log
            await logAction({
                userId: user.id,
                action: AuditAction.ACCESS_REPORT,
                entityType: 'MedicalReport',
                entityId: report.id,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            });

            // Return file
            return new NextResponse(new Blob([fileBuffer as any]), {
                headers: {
                    'Content-Type': report.mimeType,
                    'Content-Disposition': `inline; filename="${report.title}"`,
                    'X-Medical-Notice': 'Access logged and legally auditable',
                },
            });
        } catch (error: any) {
            if (error.message.includes('hash mismatch')) {
                return NextResponse.json(
                    { error: 'File integrity check failed: file may have been tampered with' },
                    { status: 500 }
                );
            }
            throw error;
        }
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Get report error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
