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
    doctor?: {
        name: string;
    };
}

export default function PatientDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComplaint, setNewComplaint] = useState('');
    const [creating, setCreating] = useState(false);

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
            setUser(data.user);

            // Fetch real consultations
            try {
                const consultsRes = await fetch('/api/consultations');
                if (consultsRes.ok) {
                    const consultsData = await consultsRes.json();
                    setConsultations(consultsData.consultations);
                }
            } catch (e) {
                console.error("Failed to fetch consultations", e);
            }

            setLoading(false);
        } catch (error) {
            router.push('/login');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleCreateConsultation = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const response = await fetch('/api/consultations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chiefComplaint: newComplaint }),
            });
            if (response.ok) {
                showToast('Consultation created successfully! An admin will assign a doctor shortly.', 'success');
                setNewComplaint('');
                // Refresh list
                const consultsRes = await fetch('/api/consultations');
                if (consultsRes.ok) {
                    const consultsData = await consultsRes.json();
                    setConsultations(consultsData.consultations);
                }
            }
        } catch (error) {
            showToast('Failed to create consultation', 'error');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Premium Header */}
            <div className="bg-white shadow-lg border-b border-gray-100">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                                <span className="text-2xl">🏥</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gradient">MediConsult</h1>
                                <p className="text-sm text-gray-500 font-medium">Patient Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm text-gray-500">Welcome back,</p>
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
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create New Consultation */}
                        <div className="medical-card animate-fadeInUp">
                            <div className="flex items-center mb-4">
                                <div className="stat-icon mr-3">
                                    ➕
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Start New Consultation</h2>
                            </div>
                            <p className="text-gray-600 mb-6">Describe your symptoms and we'll connect you with a verified doctor</p>
                            <form onSubmit={handleCreateConsultation}>
                                <div className="mb-4">
                                    <label className="form-label">Chief Complaint</label>
                                    <textarea
                                        className="input-field"
                                        rows={4}
                                        value={newComplaint}
                                        onChange={(e) => setNewComplaint(e.target.value)}
                                        placeholder="e.g., Persistent fever (102°F) and severe headache for 3 days..."
                                        required
                                        disabled={creating}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Be as specific as possible for better diagnosis</p>
                                </div>
                                <button type="submit" className="btn-primary" disabled={creating}>
                                    {creating ? (
                                        <span className="flex items-center justify-center">
                                            <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                            Creating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            Create Consultation Request
                                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* My Consultations */}
                        <div className="medical-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">My Consultations</h2>
                                <span className="medical-badge medical-badge-active">Active Records</span>
                            </div>
                            <p className="text-gray-600 mb-6">
                                View and manage your medical consultations. All data is encrypted and audited for your protection.
                            </p>
                            <div className="space-y-4">
                                {consultations.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 font-medium">No consultations yet</p>
                                        <p className="text-sm text-gray-400 mt-2">Create your first consultation above</p>
                                    </div>
                                ) : (
                                    consultations.map((consultation) => (
                                        <div key={consultation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">{new Date(consultation.createdAt).toLocaleDateString()}</p>
                                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{consultation.chiefComplaint}</h3>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${consultation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    consultation.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                        consultation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {consultation.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">
                                                    {consultation.doctor?.name ? `Dr. ${consultation.doctor.name}` : 'Waiting for doctor...'}
                                                </span>
                                                <Link href={`/consultation/${consultation.id}`} className="text-blue-600 font-semibold hover:underline">
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="medical-card-gradient animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <h3 className="font-bold mb-4 flex items-center text-gray-900">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Link href="/patient/history" className="block w-full">
                                    <button className="btn-primary w-full text-sm">
                                        📋 View Medical History
                                    </button>
                                </Link>
                                <Link href="/patient/reports" className="block w-full">
                                    <button className="btn-secondary w-full text-sm">
                                        📁 Upload Reports
                                    </button>
                                </Link>
                                <Link href="/" className="block text-center btn-secondary w-full text-sm">
                                    🏠 Home
                                </Link>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center mb-3">
                                <div className="stat-icon mr-2">
                                    ℹ️
                                </div>
                                <h3 className="font-bold text-gray-900">How It Works</h3>
                            </div>
                            <ol className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start">
                                    <span className="font-bold mr-2 text-blue-600">1.</span>
                                    <span>Create consultation request</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold mr-2 text-purple-600">2.</span>
                                    <span>Admin assigns verified doctor</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold mr-2 text-green-600">3.</span>
                                    <span>Doctor starts session & chats</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold mr-2 text-orange-600">4.</span>
                                    <span>Receive prescriptions & tests</span>
                                </li>
                            </ol>
                        </div>

                        {/* Security Notice */}
                        <div className="success-notice animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-green-900 mb-1">
                                        🔒 Your data is secure
                                    </p>
                                    <p className="text-xs text-green-700">
                                        All consultations are encrypted, logged, and legally auditable for your protection
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
