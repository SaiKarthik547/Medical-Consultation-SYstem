'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientHistoryPage() {
    const router = useRouter();
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            const data = await response.json();
            if (data.user.role !== 'PATIENT') {
                router.push('/login');
                return;
            }
            fetchHistory();
        } catch (error) {
            router.push('/login');
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/consultations');
            if (res.ok) {
                const data = await res.json();
                const history = data.consultations.filter((c: any) =>
                    c.status === 'COMPLETED' || c.status === 'CANCELLED'
                );
                setConsultations(history);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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
                        <h1 className="text-xl font-bold text-gray-900">Medical History</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="medical-card">
                    {consultations.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No completed consultations found.</p>
                    ) : (
                        <div className="space-y-4">
                            {consultations.map((consultation) => (
                                <div key={consultation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{consultation.chiefComplaint}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(consultation.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Doctor: {consultation.doctor?.name || 'Unassigned'}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${consultation.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {consultation.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <Link href={`/consultation/${consultation.id}`} className="text-blue-600 text-sm font-medium hover:underline">
                                            View Archive →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
