'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Consultation {
    id: string;
    status: string;
    chiefComplaint: string;
    createdAt: string;
    assignedAt: string | null;
    startedAt: string | null;
    patient: {
        name: string;
        email: string;
    };
}

export default function DoctorDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (user) {
            fetchConsultations();
        }
    }, [user]);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                router.push('/login');
                return;
            }
            const data = await response.json();
            if (data.user.role !== 'DOCTOR') {
                router.push('/login');
                return;
            }
            setUser(data.user);
            setLoading(false);
        } catch (error) {
            router.push('/login');
        }
    };

    const fetchConsultations = async () => {
        try {
            setLoadingConsultations(true);
            const response = await fetch('/api/consultations');
            if (response.ok) {
                const data = await response.json();
                setConsultations(data.consultations || []);
            }
        } catch (error) {
            console.error('Error fetching consultations:', error);
        } finally {
            setLoadingConsultations(false);
        }
    };

    const handleStartConsultation = async (consultationId: string) => {
        try {
            const response = await fetch(`/api/consultations/${consultationId}/start`, {
                method: 'POST',
            });
            if (response.ok) {
                fetchConsultations(); // Refresh the list
            } else {
                alert('Failed to start consultation');
            }
        } catch (error) {
            console.error('Error starting consultation:', error);
            alert('Error starting consultation');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const assignedConsultations = consultations.filter(c => c.status === 'ASSIGNED');
    const activeConsultations = consultations.filter(c => c.status === 'ACTIVE');

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
            {/* Premium Header */}
            <div className="bg-white shadow-lg border-b border-gray-100">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                                <span className="text-2xl">🩺</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gradient">MediConsult</h1>
                                <p className="text-sm text-gray-500 font-medium">Doctor Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm text-gray-500">Welcome,</p>
                                <p className="font-semibold text-gray-900">{user?.name}</p>
                            </div>
                            <button onClick={handleLogout} className="btn-secondary">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Assigned Consultations */}
                        <div className="medical-card animate-fadeInUp">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="stat-icon mr-3">📋</div>
                                    <h2 className="text-2xl font-bold text-gray-900">Assigned Consultations</h2>
                                </div>
                                {assignedConsultations.length > 0 && (
                                    <span className="medical-badge medical-badge-pending">{assignedConsultations.length} Assigned</span>
                                )}
                            </div>
                            <p className="text-gray-600 mb-6">
                                Consultations assigned to you. Start sessions to begin treating patients.
                            </p>

                            {loadingConsultations ? (
                                <div className="text-center py-8">
                                    <div className="spinner mx-auto mb-2"></div>
                                    <p className="text-gray-500 text-sm">Loading consultations...</p>
                                </div>
                            ) : assignedConsultations.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">No pending consultations</p>
                                    <p className="text-sm text-gray-400 mt-2">New assignments will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignedConsultations.map((consultation) => (
                                        <div key={consultation.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-white">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-gray-900">{consultation.patient.name}</h3>
                                                        <span className="medical-badge medical-badge-pending text-xs">Assigned</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <strong>Chief Complaint:</strong> {consultation.chiefComplaint}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Assigned: {new Date(consultation.assignedAt!).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleStartConsultation(consultation.id)}
                                                className="btn-primary w-full text-sm"
                                            >
                                                🚀 Start Consultation
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Sessions */}
                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="stat-icon mr-3">💚</div>
                                    <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
                                </div>
                                {activeConsultations.length > 0 && (
                                    <span className="medical-badge medical-badge-active">
                                        {activeConsultations.length} Active
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 mb-6">
                                Currently active consultations. Chat, prescribe, and order tests.
                            </p>

                            {loadingConsultations ? (
                                <div className="text-center py-8">
                                    <div className="spinner mx-auto mb-2"></div>
                                    <p className="text-gray-500 text-sm">Loading sessions...</p>
                                </div>
                            ) : activeConsultations.length === 0 ? (
                                <div className="border-2 border-dashed border-green-200 rounded-xl p-8 text-center bg-green-50">
                                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-green-700 font-medium">No active sessions</p>
                                    <p className="text-sm text-green-600 mt-2">Start assigned consultations to begin</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeConsultations.map((consultation) => (
                                        <div key={consultation.id} className="border border-green-200 rounded-xl p-5 bg-green-50 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-gray-900">{consultation.patient.name}</h3>
                                                        <span className="medical-badge medical-badge-active text-xs">Active</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        <strong>Chief Complaint:</strong> {consultation.chiefComplaint}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Started: {new Date(consultation.startedAt!).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link href={`/consultation/${consultation.id}`} className="btn-primary text-sm text-center">
                                                    💬 Open Chat
                                                </Link>
                                                <Link href={`/consultation/${consultation.id}`} className="btn-secondary text-sm text-center">
                                                    📋 Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="medical-card-gradient animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <h3 className="font-bold mb-4 flex items-center text-gray-900">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => fetchConsultations()}
                                    className="btn-primary w-full text-sm"
                                >
                                    🔄 Refresh
                                </button>
                                <Link href="/doctor/history" className="block w-full">
                                    <button className="btn-secondary w-full text-sm">
                                        📚 Consultation History
                                    </button>
                                </Link>
                                <Link href="/" className="block text-center btn-secondary w-full text-sm">
                                    🏠 Home
                                </Link>
                            </div>
                        </div>

                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <h3 className="font-bold mb-3 flex items-center text-gray-900">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verification Status
                            </h3>
                            {user?.doctorProfile?.isVerified ? (
                                <>
                                    <div className="medical-badge-verified mb-3">
                                        ✓ Verified Doctor
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        You can prescribe medications and order diagnostic tests. Your credentials are verified.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="medical-badge medical-badge-pending mb-3">
                                        ⏳ Pending Verification
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Your account is pending verification. You cannot prescribe medications until verified by an administrator.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="emergency-notice animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                                        Emergency Access Notice
                                    </p>
                                    <p className="text-xs text-yellow-700 audit-notice">
                                        Access to patient data is logged and legally auditable. All actions are tracked for compliance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
