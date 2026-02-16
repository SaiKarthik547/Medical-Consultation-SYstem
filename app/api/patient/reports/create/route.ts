import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { saveFile, isValidFileType, isValidFileSize } from '@/lib/file';
import { sanitizeInput } from '@/lib/validation';

// Allowed file types for medical reports
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const user = await requireRole('PATIENT');
        const formData = await request.formData();

        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!isValidFileType(file.type, ALLOWED_TYPES)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
            return NextResponse.json(
                { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedTitle = sanitizeInput(title || file.name);
        const sanitizedDescription = sanitizeInput(description || '');

        const buffer = Buffer.from(await file.arrayBuffer());

        // Save file with real SHA-256 hash and verification
        const { filePath, fileHash, fileSize } = await saveFile(
            buffer,
            file.name,
            file.type
        );

        const report = await prisma.medicalReport.create({
            data: {
                patientId: user.id,
                title: sanitizedTitle,
                description: sanitizedDescription,
                filePath,
                fileHash, // Real SHA-256 hash, not placeholder
                fileSize,
                mimeType: file.type,
            }
        });

        return NextResponse.json({ report });
    } catch (error: any) {
        console.error("Upload error:", error);
        if (error.name === 'UnauthorizedError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
