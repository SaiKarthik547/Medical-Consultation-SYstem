// Upload medical report with SHA256 hash verification
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { saveFile, isValidFileType, isValidFileSize } from '@/lib/file';
import { logAction, AuditAction } from '@/lib/audit';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string | null;
        const consultationId = formData.get('consultationId') as string | null;

        if (!file || !title) {
            return NextResponse.json(
                { error: 'File and title required' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!isValidFileType(file.type, config.allowedFileTypes.reports)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: PDF, JPEG, PNG' },
                { status: 400 }
            );
        }

        // Validate file size
        if (!isValidFileSize(file.size, config.maxFileSize)) {
            return NextResponse.json(
                { error: `File too large. Max size: ${config.maxFileSize / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // If consultationId provided, verify access
        if (consultationId) {
            const consultation = await prisma.consultationSession.findUnique({
                where: { id: consultationId },
            });

            if (!consultation) {
                return NextResponse.json(
                    { error: 'Consultation not found' },
                    { status: 404 }
                );
            }

            // Patient can upload to own consultations, doctor to assigned consultations
            const isPatient = user.id === consultation.patientId && user.role === 'PATIENT';
            const isDoctor = user.id === consultation.doctorId && user.role === 'DOCTOR';

            if (!isPatient && !isDoctor) {
                return NextResponse.json(
                    { error: 'Not authorized for this consultation' },
                    { status: 403 }
                );
            }
        } else {
            // Only patients can upload reports not linked to consultation
            if (user.role !== 'PATIENT') {
                return NextResponse.json(
                    { error: 'Only patients can upload standalone reports' },
                    { status: 403 }
                );
            }
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save file with hash computation
        const { filePath, fileHash, fileSize } = await saveFile(
            buffer,
            file.name,
            file.type
        );

        // Create medical report record
        const patientId = user.role === 'PATIENT' ? user.id : (await prisma.consultationSession.findUnique({
            where: { id: consultationId! },
            select: { patientId: true },
        }))!.patientId;

        const report = await prisma.medicalReport.create({
            data: {
                patientId,
                consultationId: consultationId || null,
                title,
                description: description || null,
                filePath,
                fileHash, // SHA256 for integrity verification
                fileSize,
                mimeType: file.type,
            },
        });

        // Audit log
        await logAction({
            userId: user.id,
            action: AuditAction.UPLOAD_REPORT,
            entityType: 'MedicalReport',
            entityId: report.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json(
            {
                message: 'Report uploaded successfully with integrity verification',
                report,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
            return NextResponse.json(
                { error: error.message },
                { status: error.name === 'UnauthorizedError' ? 401 : 403 }
            );
        }

        console.error('Upload report error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
