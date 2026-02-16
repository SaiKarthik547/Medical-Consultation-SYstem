'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import PaymentModal from '@/components/PaymentModal';
import { User, Consultation, Medication } from '@/types';

export default function ConsultationRoom() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const id = params?.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');

    // Chat State
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Prescription State
    const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: '', duration: '' }]);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    const [submittingRx, setSubmittingRx] = useState(false);

    // Test State
    const [testName, setTestName] = useState('');
    const [testInstructions, setTestInstructions] = useState('');
    const [submittingTest, setSubmittingTest] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [startingSession, setStartingSession] = useState(false);

    useEffect(() => {
        checkAuth();
        // Poll for updates every 15 seconds
        const poller = setInterval(() => {
            if (id) fetchConsultation(false);
        }, 15000);
        return () => clearInterval(poller);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [consultation?.chatMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                fetchConsultation(true);
            } else {
                router.push('/login');
            }
        } catch (error) {
            router.push('/login');
        }
    };

    const fetchConsultation = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const res = await fetch(`/api/consultations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setConsultation(data.consultation);
            } else {
                // If 403 or 404, maybe redirect
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/consultations/${id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (res.ok) {
                setMessage('');
                fetchConsultation(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    // Prescription Handlers
    const addMedicationRow = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        setMedications(newMeds);
    };

    const handleSubmitPrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingRx(true);
        try {
            const res = await fetch(`/api/consultations/${id}/prescription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medications, diagnosis, notes: prescriptionNotes }),
            });
            if (res.ok) {
                showToast('Prescription issued successfully', 'success');
                setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
                setDiagnosis('');
                setPrescriptionNotes('');
                fetchConsultation(false);
            }
        } catch (e) {
            showToast('Error issuing prescription', 'error');
        } finally {
            setSubmittingRx(false);
        }
    };

    // Test Handlers
    const handleSubmitTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingTest(true);
        try {
            const res = await fetch(`/api/consultations/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testName, instructions: testInstructions }),
            });
            if (res.ok) {
                showToast('Test ordered successfully', 'success');
                setTestName('');
                setTestInstructions('');
                fetchConsultation(false);
            }
        } catch (e) {
            showToast('Error ordering test', 'error');
        } finally {
            setSubmittingTest(false);
        }
    };

    const handleCloseConsultation = async () => {
        if (!confirm('Are you sure you want to close this consultation?')) return;
        try {
            const res = await fetch('/api/consultations/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultationId: id }),
            });
            if (res.ok) {
                fetchConsultation(true);
            }
        } catch (e) {
            showToast('Error closing consultation', 'error');
        }
    };

    const handlePaymentComplete = async () => {
        setProcessingPayment(true);
        try {
            const res = await fetch(`/api/consultations/${id}/pay`, { method: 'POST' });
            if (res.ok) {
                showToast('Payment successful', 'success');
                fetchConsultation(false);
            } else {
                showToast('Payment failed', 'error');
            }
        } catch (e) {
            showToast('Payment error', 'error');
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleStartSession = async () => {
        setStartingSession(true);
        try {
            const res = await fetch(`/api/consultations/${id}/start`, { method: 'POST' });
            if (res.ok) {
                showToast('Session started', 'success');
                fetchConsultation(false);
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to start session', 'error');
            }
        } catch (e) {
            showToast('Error starting session', 'error');
        } finally {
            setStartingSession(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
    if (!consultation) return <div className="p-8 text-center text-red-500">Consultation not found or access denied</div>;

    const isDoctor = user?.role === 'DOCTOR';
    const isCompleted = consultation.status === 'COMPLETED' || consultation.status === 'CANCELLED';
    const isActive = consultation.status === 'ACTIVE';
    // Check payment status from consultation.payments array
    const isPaid = consultation.payments?.some((p) => p.status === 'COMPLETED');
    const isPatient = user?.role === 'PATIENT';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {isPatient && !isPaid && !isCompleted && (
                <PaymentModal
                    consultationId={id}
                    amount={500}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <Link href={isDoctor ? '/doctor' : '/patient'} className="text-gray-500 hover:text-gray-900">
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Detail: {consultation.chiefComplaint}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${consultation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                consultation.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {consultation.status}
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500">
                            Patient: {consultation.patient.name} • Doctor: {consultation.doctor?.name || 'Unassigned'}
                        </p>
                    </div>
                </div>
                {isDoctor && !isCompleted && (
                    <button onClick={handleCloseConsultation} className="btn-danger py-2 px-4 text-sm">
                        Close Consultation
                    </button>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl flex flex-col md:flex-row gap-6 h-[calc(100dvh-80px)]">
                {/* Left: Chat */}
                <div className={`flex flex-col bg-white rounded-xl shadow-sm border flex-grow ${activeTab === 'chat' ? 'block' : 'hidden md:flex'}`}>
                    <div className="p-4 border-b bg-gray-50 rounded-t-xl flex justify-between">
                        <h2 className="font-semibold text-gray-700">Live Chat</h2>
                        <div className="md:hidden">
                            {/* Mobile Tab Switcher in Chat Header if needed, usually tabs are below */}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {consultation.chatMessages.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm mt-10">No messages start the conversation.</p>
                        ) : (
                            consultation.chatMessages.map((msg) => {
                                const isMe = user && msg.sender.id === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'
                                            }`}>
                                            <p>{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {msg.sender.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {!isCompleted && (isDoctor || isPaid) && (
                        <div className="p-4 border-t bg-white rounded-b-xl">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    className="flex-1 input-field py-2"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <button type="submit" disabled={sending} className="btn-primary py-2 px-4">
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                    {!isCompleted && isPatient && !isPaid && (
                        <div className="p-4 border-t bg-yellow-50 rounded-b-xl">
                            <p className="text-sm text-yellow-800 text-center">
                                💳 Please complete payment to start chatting with your doctor
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Tools & Info (Doctor Controls / Patient Info) */}
                <div className="w-full md:w-96 flex flex-col gap-6">
                    {/* Tabs for Right Panel */}
                    {isDoctor ? (
                        <>
                            <div className="flex border-b">
                                <button
                                    onClick={() => setActiveTab('rx')}
                                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'rx' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                >
                                    Prescriptions
                                </button>
                                <button
                                    onClick={() => setActiveTab('labs')}
                                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'labs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                >
                                    Lab Tests
                                </button>
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                >
                                    Info
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'rx' && (
                                    <div className="space-y-4">
                                        {consultation.prescriptions.map((rx) => {
                                            const meds = JSON.parse(rx.medications) as Medication[];
                                            return (
                                                <div key={rx.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-900">Rx: {rx.diagnosis}</h4>
                                                        <span className="text-xs text-gray-500">{new Date(rx.issuedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <ul className="text-sm space-y-1 mb-2">
                                                        {meds.map((m, i) => (
                                                            <li key={i}>• {m.name} ({m.dosage}) - {m.frequency}</li>
                                                        ))}
                                                    </ul>
                                                    {rx.notes && <p className="text-xs text-gray-600 italic">"{rx.notes}"</p>}
                                                    <div className="mt-2 text-xs text-gray-400">Dr. {rx.doctor.name}</div>
                                                </div>
                                            );
                                        })}

                                        {!isCompleted && (
                                            <div className="bg-white p-4 rounded-xl border shadow-sm">
                                                <h3 className="font-bold text-sm mb-3">Add Prescription</h3>
                                                <form onSubmit={handleSubmitPrescription} className="space-y-3">
                                                    <input className="input-field py-2 text-sm" placeholder="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
                                                    {medications.map((med, i) => (
                                                        <div key={i} className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded">
                                                            <input placeholder="Drug Name" className="p-1 border rounded text-xs" value={med.name} onChange={e => updateMedication(i, 'name', e.target.value)} required />
                                                            <input placeholder="Dosage" className="p-1 border rounded text-xs" value={med.dosage} onChange={e => updateMedication(i, 'dosage', e.target.value)} required />
                                                            <input placeholder="Frequency" className="p-1 border rounded text-xs" value={med.frequency} onChange={e => updateMedication(i, 'frequency', e.target.value)} required />
                                                            <input placeholder="Duration" className="p-1 border rounded text-xs" value={med.duration} onChange={e => updateMedication(i, 'duration', e.target.value)} required />
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={addMedicationRow} className="text-xs text-blue-600 font-medium">+ Add Drug</button>
                                                    <textarea className="input-field py-2 text-sm" placeholder="Notes" rows={2} value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)} />
                                                    <button type="submit" disabled={submittingRx} className="btn-primary w-full py-2 text-sm">Issue Prescription</button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'labs' && (
                                    <div className="space-y-4">
                                        {consultation.diagnosticTests.map((test) => (
                                            <div key={test.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                                <div className="flex justify-between">
                                                    <h4 className="font-bold text-gray-900">{test.testName}</h4>
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">{test.status}</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">{test.instructions}</p>
                                                <div className="mt-2 text-xs text-gray-400">Ordered by Dr. {test.orderedBy.name}</div>
                                            </div>
                                        ))}

                                        {!isCompleted && (
                                            <div className="bg-white p-4 rounded-xl border shadow-sm">
                                                <h3 className="font-bold text-sm mb-3">Order Lab Test</h3>
                                                <form onSubmit={handleSubmitTest} className="space-y-3">
                                                    <input className="input-field py-2 text-sm" placeholder="Test Name (e.g. CBC, X-Ray)" value={testName} onChange={e => setTestName(e.target.value)} required />
                                                    <textarea className="input-field py-2 text-sm" placeholder="Instructions/Reason" rows={2} value={testInstructions} onChange={e => setTestInstructions(e.target.value)} />
                                                    <button type="submit" disabled={submittingTest} className="btn-secondary w-full py-2 text-sm">Order Test</button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'info' && (
                                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">Patient</h4>
                                            <p className="font-medium text-gray-900">{consultation.patient.name}</p>
                                            <p className="text-sm text-gray-600">{consultation.patient.email}</p>
                                            <p className="text-sm text-gray-600">{consultation.patient.phone || 'No phone'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">Chief Complaint</h4>
                                            <p className="text-sm text-gray-800">{consultation.chiefComplaint}</p>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">Created</h4>
                                            <p className="text-sm text-gray-600">{new Date(consultation.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Patient View - Info Only */
                        <div className="flex-1 overflow-y-auto">
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-bold text-gray-900 mb-4">Consultation Details</h3>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Doctor</h4>
                                    <p className="font-medium text-gray-900">{consultation.doctor?.name || 'Not assigned yet'}</p>
                                    {consultation.doctor?.email && <p className="text-sm text-gray-600">{consultation.doctor.email}</p>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Your Complaint</h4>
                                    <p className="text-sm text-gray-800">{consultation.chiefComplaint}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Status</h4>
                                    <p className="text-sm text-gray-800">{consultation.status}</p>
                                </div>
                                {consultation.prescriptions.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Prescriptions</h4>
                                        {consultation.prescriptions.map((rx) => {
                                            const meds = JSON.parse(rx.medications) as Medication[];
                                            return (
                                                <div key={rx.id} className="bg-blue-50 p-3 rounded-lg mb-2">
                                                    <p className="font-semibold text-sm text-gray-900 mb-1">{rx.diagnosis}</p>
                                                    <ul className="text-xs space-y-1">
                                                        {meds.map((m, i) => (
                                                            <li key={i}>• {m.name} - {m.dosage}, {m.frequency} for {m.duration}</li>
                                                        ))}
                                                    </ul>
                                                    {rx.notes && <p className="text-xs text-gray-600 italic mt-1">"{rx.notes}"</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {consultation.diagnosticTests.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Lab Tests Ordered</h4>
                                        {consultation.diagnosticTests.map((test) => (
                                            <div key={test.id} className="bg-yellow-50 p-3 rounded-lg mb-2">
                                                <p className="font-semibold text-sm text-gray-900">{test.testName}</p>
                                                <p className="text-xs text-gray-600 mt-1">{test.instructions}</p>
                                                <span className="inline-block mt-1 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">{test.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="pt-2 border-t">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Created</h4>
                                    <p className="text-sm text-gray-600">{new Date(consultation.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
