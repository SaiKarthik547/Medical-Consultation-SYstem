'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function AdminUsersPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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
            fetchUsers();
        } catch (error) {
            router.push('/login');
        }
    };

    const fetchUsers = async () => {
        try {
            // We need an endpoint for this. I'll create/use /api/admin/users
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDoctor = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/verify-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                // Refresh list
                fetchUsers();
                showToast('Doctor verified successfully', 'success');
            } else {
                showToast('Failed to verify doctor', 'error');
            }
        } catch (e) {
            showToast('Error verifying doctor', 'error');
        } finally {
            setActionLoading(null);
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
                        <Link href="/admin" className="text-gray-500 hover:text-gray-900">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Name/Email</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.role === 'DOCTOR' && (
                                            user.doctorProfile?.isVerified ? (
                                                <span className="text-green-600 text-sm flex items-center">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="text-yellow-600 text-sm flex items-center">
                                                    ⚠️ Pending
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {user.role === 'DOCTOR' && !user.doctorProfile?.isVerified && (
                                            <button
                                                onClick={() => handleVerifyDoctor(user.id)}
                                                disabled={actionLoading === user.id}
                                                className="btn-success py-1 px-3 text-sm"
                                            >
                                                {actionLoading === user.id ? 'Verifying...' : 'Verify Schema'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
