'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface QueueItem {
    id: string;
    queuePosition: number;
    waitTime: number;
    chiefComplaint: string;
    createdAt: string;
    patient: {
        id: string;
        name: string;
        email: string;
        dateOfBirth?: string;
        gender?: string;
    };
}

export default function DoctorQueuePanel() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/consultations/queue');
            if (!res.ok) throw new Error('Failed to fetch queue');
            const data = await res.json();
            setQueue(data.queue || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        // Poll every 10 seconds
        const interval = setInterval(fetchQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleAccept = async (consultationId: string) => {
        setAccepting(consultationId);
        setError(null);

        try {
            const res = await fetch(`/api/consultations/${consultationId}/accept`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to accept consultation');
            }

            // Refresh queue
            await fetchQueue();

            // Show success message
            alert(`Successfully accepted consultation! Patient has 15 minutes to pay.`);

        } catch (err: any) {
            setError(err.message);
            alert(`Error: ${err.message}`);
        } finally {
            setAccepting(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Patient Queue</h2>
                <p className="text-gray-500">Loading queue...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Patient Queue</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {queue.length} waiting
                </span>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {queue.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No patients in queue</p>
            ) : (
                <div className="space-y-3">
                    {queue.map((item) => (
                        <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                                            #{item.queuePosition}
                                        </span>
                                        <h3 className="font-semibold text-lg">{item.patient.name}</h3>
                                    </div>

                                    <p className="text-gray-600 mb-2">
                                        <strong>Chief Complaint:</strong> {item.chiefComplaint}
                                    </p>

                                    <div className="flex gap-4 text-sm text-gray-500">
                                        {item.patient.gender && (
                                            <span>Gender: {item.patient.gender}</span>
                                        )}
                                        {item.patient.dateOfBirth && (
                                            <span>DOB: {new Date(item.patient.dateOfBirth).toLocaleDateString()}</span>
                                        )}
                                        <span className="text-orange-600 font-medium">
                                            Waiting: {item.waitTime} min
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAccept(item.id)}
                                    disabled={accepting === item.id}
                                    className="ml-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    {accepting === item.id ? 'Accepting...' : 'Accept Patient'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 text-sm text-gray-500 text-center">
                Auto-refreshes every 10 seconds
            </div>
        </div>
    );
}
