import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// S3 Client configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mediconsult-files';

/**
 * Upload file to S3 with encryption
 * @param buffer File buffer
 * @param filename Original filename
 * @param mimeType File MIME type
 * @returns Object with S3 key, hash, and size
 */
export async function uploadToS3(
    buffer: Buffer,
    filename: string,
    mimeType: string
): Promise<{ key: string; hash: string; size: number; url: string }> {
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Generate unique key with timestamp and hash prefix
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${hash.substring(0, 8)}-${sanitizedFilename}`;

    // Upload to S3 with server-side encryption
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256', // Encryption at rest
        Metadata: {
            'original-filename': filename,
            'file-hash': hash,
        },
    });

    await s3Client.send(command);

    return {
        key,
        hash: `sha256:${hash}`,
        size: buffer.length,
        url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
    };
}

/**
 * Get presigned URL for secure file download
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete file from S3
 * @param key S3 object key
 */
export async function deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * Verify file integrity
 * @param buffer File buffer
 * @param expectedHash Expected SHA-256 hash
 * @returns True if hash matches
 */
export function verifyFileIntegrity(buffer: Buffer, expectedHash: string): boolean {
    const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const cleanExpectedHash = expectedHash.replace('sha256:', '');
    return actualHash === cleanExpectedHash;
}
