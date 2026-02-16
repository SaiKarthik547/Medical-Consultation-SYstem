'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'PATIENT',
        registrationNumber: '',
        specialization: '',
        qualifications: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8 px-4">
            <div className="medical-card max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-primary-900 mb-2">
                        MediConsult
                    </h1>
                    <h2 className="text-xl text-gray-700">Register</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Password * (min 8 chars)</label>
                            <input
                                type="password"
                                name="password"
                                className="input-field"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="form-label">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                className="input-field"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Role *</label>
                        <select
                            name="role"
                            className="input-field"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="PATIENT">Patient</option>
                            <option value="DOCTOR">Doctor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {formData.role === 'DOCTOR' && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                                <p className="text-sm text-blue-800 font-medium mb-2">
                                    Doctor Registration
                                </p>
                                <p className="text-xs text-blue-700">
                                    Doctors must be verified before they can prescribe medications or order tests.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Registration Number *</label>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        className="input-field"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        required={formData.role === 'DOCTOR'}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Specialization *</label>
                                    <input
                                        type="text"
                                        name="specialization"
                                        className="input-field"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        required={formData.role === 'DOCTOR'}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Qualifications</label>
                                <textarea
                                    name="qualifications"
                                    className="input-field"
                                    value={formData.qualifications}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="e.g., MBBS, MD"
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:underline font-medium">
                            Login
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-sm text-primary-600 hover:underline">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
