'use client';

import { useState } from 'react';

interface PaymentModalProps {
    consultationId: string;
    amount: number;
    onPaymentComplete: () => void;
    onCancel?: () => void;
}

export default function PaymentModal({ consultationId, amount, onPaymentComplete, onCancel }: PaymentModalProps) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleMockPayment = async (action: 'done' | 'cancel') => {
        setProcessing(true);
        setError('');

        try {
            const res = await fetch(`/api/consultations/${consultationId}/mock-pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            if (action === 'done') {
                onPaymentComplete();
            } else if (onCancel) {
                onCancel();
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform scale-100 transition-all">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">💳</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Consultation Fee</h2>
                    <p className="text-gray-500 mt-2">Complete payment to proceed with consultation</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Consultation Fee</span>
                        <span className="font-semibold text-gray-900">₹{amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Service Tax</span>
                        <span className="font-semibold text-gray-900">₹0</span>
                    </div>
                    <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="font-bold text-blue-600 text-xl">₹{amount}</span>
                    </div>
                </div>

                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg flex items-start">
                    <span className="mr-2 text-lg">⚠️</span>
                    <p className="leading-tight pt-1">
                        <strong>Mock Payment Mode</strong><br />
                        This is a test environment. Click "Payment Done" to simulate successful payment.
                    </p>
                </div>

                <div className="mb-6 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex items-start">
                    <span className="mr-2 text-lg">ℹ️</span>
                    <p className="leading-tight pt-1">
                        <strong>Payment confirms booking.</strong><br />
                        Medical advice is provided only after the doctor explicitly starts the session.
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                <div className="space-y-3">
                    <button
                        onClick={() => handleMockPayment('done')}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        {processing ? 'Processing...' : '✅ Payment Done (Mock)'}
                    </button>

                    <button
                        onClick={() => handleMockPayment('cancel')}
                        disabled={processing}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                        ❌ Cancel Payment
                    </button>
                </div>

                <p className="text-xs text-center text-gray-400 mt-4">
                    Mock Payment System - For Testing Only
                </p>
            </div>
        </div>
    );
}
