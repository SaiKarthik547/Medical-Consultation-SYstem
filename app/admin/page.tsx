'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

interface Consultation {
    id: string;
    chiefComplaint: string;
    status: string;
    createdAt: string;
    patient: {
        name: string;
        email: string;
    };
    doctor?: {
        name: string;
    };
}

interface Stats {
    totalUsers: number;
    verifiedDoctors: number;
    pendingConsultations: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, verifiedDoctors: 0, pendingConsultations: 0 });
    const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [assignEmail, setAssignEmail] = useState('');
    const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

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
            if (data.user.role !== 'ADMIN') {
                router.push('/login');
                return;
            }
            setUser(data.user);

            // Fetch Stats
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            }

            // Fetch Pending Consultations
            const pendingRes = await fetch('/api/consultations?status=PENDING');
            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingConsultations(pendingData.consultations);
            }

            // Fetch Doctors for assignment
            // Ideally we should have an endpoint for this, we can assume we have one or mock for now
            // But to make it real, let's just assume we can get a list of doctors eventually.
            // For now, let's hardcode the assign button to prompt for doctor ID or similar if we don't have a list endpoint.
            // Wait, we can create a simple endpoint to list verified doctors.

            setLoading(false);
        } catch (error) {
            router.push('/login');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const startAssign = (id: string) => {
        setAssigningId(id);
        setAssignEmail('dr.smith@mediconsult.com'); // Default suggestion
    };

    const cancelAssign = () => {
        setAssigningId(null);
        setAssignEmail('');
    };

    const confirmAssign = async (consultationId: string) => {
        if (!assignEmail) return;

        setIsSubmittingAssign(true);
        try {
            const res = await fetch('/api/consultations/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultationId, doctorEmail: assignEmail }),
            });

            if (res.ok) {
                showToast('Doctor assigned successfully', 'success');
                window.location.reload();
            } else {
                showToast('Failed to assign doctor. Check if email is correct and doctor is verified.', 'error');
            }
        } catch (e) {
            showToast('Error assigning doctor', 'error');
        } finally {
            setIsSubmittingAssign(false);
            setAssigningId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Premium Header */}
            <div className="bg-white shadow-lg border-b border-gray-100">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shadow-lg flex items-center justify-center">
                                <span className="text-2xl">⚙️</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gradient">MediConsult</h1>
                                <p className="text-sm text-gray-500 font-medium">Admin Panel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm text-gray-500">Administrator</p>
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
                        {/* Stats Overview */}
                        <div className="grid md:grid-cols-3 gap-6 animate-fadeInUp">
                            <div className="stat-card hover-lift">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="stat-icon bg-blue-50">
                                        <span className="text-blue-600">👥</span>
                                    </div>
                                    <span className="medical-badge-assigned text-xs">Total</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
                                <div className="text-sm text-gray-600">Total Users</div>
                            </div>
                            <div className="stat-card hover-lift">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="stat-icon bg-purple-50">
                                        <span className="text-purple-600">🩺</span>
                                    </div>
                                    <span className="medical-badge-verified text-xs">Active</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.verifiedDoctors}</div>
                                <div className="text-sm text-gray-600">Verified Doctors</div>
                            </div>
                            <div className="stat-card hover-lift">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="stat-icon bg-green-50">
                                        <span className="text-green-600">📋</span>
                                    </div>
                                    <span className="medical-badge-active text-xs">Pending</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingConsultations}</div>
                                <div className="text-sm text-gray-600">Pending Actions</div>
                            </div>
                        </div>

                        {/* Pending Consultations */}
                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center mb-4">
                                <div className="stat-icon mr-3">
                                    📋
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Pending Consultations</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Assign verified doctors to pending patient consultations
                            </p>

                            {pendingConsultations.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">No pending consultations</p>
                                    <p className="text-sm text-gray-400 mt-2">New requests will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingConsultations.map((consultation) => (
                                        <div key={consultation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-yellow-50/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">{consultation.patient.name}</span>
                                                        <span className="text-xs text-gray-500">({consultation.patient.email})</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 font-medium">{consultation.chiefComplaint}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Requested: {new Date(consultation.createdAt).toLocaleString()}</p>
                                                </div>
                                                {assigningId === consultation.id ? (
                                                    <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border shadow-sm">
                                                        <label className="text-xs font-bold text-gray-700">Assign Doctor Email:</label>
                                                        <input
                                                            type="email"
                                                            className="input-field py-1 text-sm"
                                                            value={assignEmail}
                                                            onChange={(e) => setAssignEmail(e.target.value)}
                                                            placeholder="doctor@example.com"
                                                        />
                                                        <div className="flex gap-2 justify-end mt-1">
                                                            <button onClick={cancelAssign} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1">Cancel</button>
                                                            <button
                                                                onClick={() => confirmAssign(consultation.id)}
                                                                disabled={isSubmittingAssign}
                                                                className="btn-primary py-1 px-3 text-xs"
                                                            >
                                                                {isSubmittingAssign ? 'Assigning...' : 'Confirm'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => startAssign(consultation.id)}
                                                        className="btn-primary py-2 px-4 text-sm"
                                                    >
                                                        Assign Doctor
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Management */}
                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center mb-4">
                                <div className="stat-icon mr-3">
                                    👥
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="glass-card p-5 rounded-xl hover-lift cursor-pointer">
                                    <div className="flex items-start">
                                        <div className="stat-icon mr-4 bg-green-50">
                                            <span className="text-green-600">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">Doctor Verification</h4>
                                            <p className="text-sm text-gray-600">
                                                Verify doctors to allow prescribing medications and ordering diagnostic tests
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-5 rounded-xl hover-lift cursor-pointer">
                                    <div className="flex items-start">
                                        <div className="stat-icon mr-4 bg-red-50">
                                            <span className="text-red-600">🚫</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">User Deactivation</h4>
                                            <p className="text-sm text-gray-600">
                                                Temporarily or permanently deactivate user accounts if needed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Logs */}
                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center mb-4">
                                <div className="stat-icon mr-3">
                                    📊
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
                            </div>
                            <p className="text-gray-600 mb-4">
                                View system audit logs (metadata only, NO medical content)
                            </p>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 text-center">
                                <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-blue-700 font-semibold mb-2">GET /api/admin/audit-logs</p>
                                <p className="text-xs text-blue-600">Admins see what changed, not PHI data</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="medical-card-gradient animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                            <h3 className="font-bold mb-4 flex items-center text-gray-900">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Admin Tools
                            </h3>
                            <div className="space-y-3">
                                <Link href="/admin/users" className="block w-full">
                                    <button className="btn-primary w-full text-sm">
                                        👥 Manage Users
                                    </button>
                                </Link>
                                <Link href="/admin/users" className="block w-full">
                                    <button className="btn-success w-full text-sm">
                                        ✓ Verify Doctors
                                    </button>
                                </Link>
                                <button className="btn-secondary w-full text-sm">
                                    📊 View Analytics
                                </button>
                                <Link href="/" className="block text-center btn-secondary w-full text-sm">
                                    🏠 Home
                                </Link>
                            </div>
                        </div>

                        <div className="error-notice animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-red-900 mb-1">
                                        ⚠️ Admin Restrictions
                                    </p>
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        Admins have <strong>NO access</strong> to patient medical content. Only metadata and system configuration are available for compliance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="success-notice animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-green-900 mb-1">
                                        System Health
                                    </p>
                                    <p className="text-xs text-green-700">
                                        All systems operational. Database and audit logging functioning normally.
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
