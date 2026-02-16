export interface User {
    id: string;
    name: string;
    email: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
}

export interface Message {
    id: string;
    message: string;
    senderId: string;
    sender: {
        id: string;
        name: string;
    };
    createdAt: string;
}

export interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export interface Prescription {
    id: string;
    diagnosis: string;
    medications: string; // JSON string
    notes?: string;
    issuedAt: string;
    doctor: {
        name: string;
    };
}

export interface DiagnosticTest {
    id: string;
    testName: string;
    instructions?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    orderedBy: {
        name: string;
    };
}

export interface Payment {
    id: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionId?: string;
    createdAt: string;
}

export interface Consultation {
    id: string;
    status: 'WAITLISTED' | 'ACCEPTED' | 'PAID' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    chiefComplaint: string;
    patientId: string;
    patient: User;
    doctorId?: string;
    doctor?: User;
    createdAt: string;
    acceptedAt?: string;
    paymentDueAt?: string;
    chatMessages: Message[];
    prescriptions: Prescription[];
    diagnosticTests: DiagnosticTest[];
    payments: Payment[];
    queuePosition?: number;
}
