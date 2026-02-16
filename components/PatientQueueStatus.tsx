'use client';

import { useState, useEffect } from 'react';

interface QueueStatusProps {
    consultationId: string;
}

interface ConsultationStatus {
    id: string;
    status: string;
    queuePosition?: number;
    acceptedAt?: string;
    paymentDueAt?: string;
    doctor?: {
        name: string;
    };
}

export default function PatientQueueStatus({ consultationId }: QueueStatusProps) {
    const [status, setStatus] = useState<ConsultationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/consultations/${consultationId}`);
            if (!res.ok) throw new Error('Failed to fetch status');
            const data = await res.json();
            setStatus(data.consultation);

            // Calculate time remaining for payment
            if (data.consultation.paymentDueAt) {
                const dueTime = new Date(data.consultation.paymentDueAt).getTime();
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((dueTime - now) / 1000));
                setTimeRemaining(remaining);
            }
        } catch (err) {
            console.error('Failed to fetch consultation status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Poll every 5 seconds if WAITLISTED or ACCEPTED
        const interval = setInterval(() => {
            if (status?.status === 'WAITLISTED' || status?.status === 'ACCEPTED') {
                fetchStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [consultationId, status?.status]);

    // Countdown timer for payment deadline
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    if (loading) {
        return <div className="text-gray-500">Loading status...</div>;
    }

    if (!status) {
        return <div className="text-red-500">Failed to load consultation status</div>;
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            {status.status === 'WAITLISTED' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-gray-800">In Queue</h3>
                    </div>
                    <p className="text-gray-600 mb-2">
                        You are waiting for a doctor to accept your consultation.
                    </p>
                    {status.queuePosition && (
                        <div className="bg-white rounded-lg p-4 mt-3">
                            <p className="text-sm text-gray-600">Your position in queue:</p>
                            <p className="text-3xl font-bold text-blue-600">#{status.queuePosition}</p>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                        ⏱️ Auto-refreshing every 5 seconds
                    </p>
                </>
            )}

            {status.status === 'ACCEPTED' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Doctor Accepted!</h3>
                    </div>
                    <p className="text-gray-600 mb-2">
                        {status.doctor?.name || 'A doctor'} has accepted your consultation.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                            ⚠️ Payment Required
                        </p>
                        <p className="text-sm text-yellow-700">
                            Please complete payment to proceed with the consultation.
                        </p>
                        {timeRemaining !== null && timeRemaining > 0 && (
                            <div className="mt-2">
                                <p className="text-2xl font-bold text-red-600">
                                    {formatTime(timeRemaining)}
                                </p>
                                <p className="text-xs text-gray-600">Time remaining to pay</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {status.status === 'PAID' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Payment Complete</h3>
                    </div>
                    <p className="text-gray-600">
                        Waiting for {status.doctor?.name || 'doctor'} to start the session...
                    </p>
                </>
            )}

            {status.status === 'ACTIVE' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Session Active</h3>
                    </div>
                    <p className="text-gray-600">
                        Your consultation with {status.doctor?.name || 'doctor'} is in progress.
                    </p>
                </>
            )}
        </div>
    );
}
