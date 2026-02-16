'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function PatientReportsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                router.push('/login');
                return;
            }
            fetchReports();
        } catch (error) {
            router.push('/login');
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/patient/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !title) {
            showToast("Please select a file and enter a title", "error");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', title);
            formData.append('description', 'Uploaded via Patient Portal'); // Could add field for this

            const res = await fetch('/api/patient/reports/create', {
                method: 'POST',
                body: formData, // No Content-Type header needed, browser sets it with boundary
            });

            if (res.ok) {
                setTitle('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchReports();
                showToast('Report uploaded successfully', 'success');
            } else {
                const err = await res.json();
                showToast('Failed to upload report: ' + (err.error || 'Unknown error'), 'error');
            }
        } catch (e) {
            showToast('Error uploading', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/patient" className="text-gray-500 hover:text-gray-900">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Medical Reports</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="medical-card">
                            <h2 className="text-lg font-bold mb-4">Your Documents</h2>
                            {reports.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No reports uploaded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reports.map((report) => (
                                        <div key={report.id} className="flex items-center p-4 border rounded-xl hover:bg-gray-50">
                                            <div className="bg-red-100 p-2 rounded-lg mr-4 text-red-600">
                                                📄
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                                <p className="text-xs text-gray-500">{new Date(report.uploadedAt).toLocaleDateString()} • {(report.fileSize / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <a
                                                href={report.filePath}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-sm font-medium hover:underline"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="medical-card">
                            <h2 className="text-lg font-bold mb-4">Upload New Report</h2>
                            <form onSubmit={handleUpload}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Lab Results - Jan 2026"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <p className="text-sm text-gray-500">{selectedFile ? selectedFile.name : 'Click to select file'}</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                    disabled={uploading || !selectedFile}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Record'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
