import crypto from 'crypto';
import path from 'path';
import { uploadToS3, verifyFileIntegrity } from './s3';

/**
 * Save file to S3 with integrity verification
 * @param buffer File buffer
 * @param filename Original filename
 * @param mimeType File MIME type
 * @returns Object with S3 URL, hash, and size
 */
export async function saveFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
): Promise<{ filePath: string; fileHash: string; fileSize: number }> {
    // Upload to S3
    const { url, hash, size } = await uploadToS3(buffer, filename, mimeType);

    return {
        filePath: url, // S3 URL
        fileHash: hash, // SHA-256 hash with prefix
        fileSize: size,
    };
}

/**
 * Read and verify file from S3
 * @param filePath S3 URL
 * @param expectedHash Expected SHA-256 hash
 * @returns File buffer if verification succeeds
 */
export async function readVerifiedFile(
    filePath: string,
    expectedHash: string
): Promise<Buffer> {
    // For S3 URLs, we would fetch from S3 and verify
    // This is a placeholder for the actual S3 download logic
    throw new Error('S3 file download not yet implemented - use presigned URLs');
}

/**
 * Validate file type against allowed types
 * @param mimeType File MIME type
 * @param allowedTypes Array of allowed MIME types
 * @returns True if valid
 */
export function isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum allowed size in bytes
 * @returns True if valid
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
}

/**
 * Sanitize filename to prevent path traversal
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
}
