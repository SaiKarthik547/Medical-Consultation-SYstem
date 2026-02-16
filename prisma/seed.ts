import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    try {
        // Admin
        let admin = await prisma.user.findUnique({ where: { email: 'admin@mediconsult.com' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: { email: 'admin@mediconsult.com', password: hashedPassword, name: 'System Admin', role: 'ADMIN', phone: '+1234567890' },
            });
            console.log('✅ Created admin');
        } else {
            console.log('⏭️  Admin exists');
        }

        // Dr. Smith
        const drSmithInit = await prisma.user.findUnique({ where: { email: 'dr.smith@mediconsult.com' }, include: { doctorProfile: true } });
        if (!drSmithInit) {
            const newDr = await prisma.user.create({
                data: { email: 'dr.smith@mediconsult.com', password: hashedPassword, name: 'Dr. Sarah Smith', role: 'DOCTOR', phone: '+1234567891' },
            });
            await prisma.doctorProfile.create({
                data: { userId: newDr.id, registrationNumber: 'MED-2024-001', specialization: 'General Medicine', qualifications: 'MBBS, MD', isVerified: true, verifiedAt: new Date(), yearsOfExperience: 10 },
            });
            console.log('✅ Created Dr. Smith');
        } else if (!drSmithInit.doctorProfile) {
            await prisma.doctorProfile.create({
                data: { userId: drSmithInit.id, registrationNumber: 'MED-2024-001', specialization: 'General Medicine', qualifications: 'MBBS, MD', isVerified: true, verifiedAt: new Date(), yearsOfExperience: 10 },
            });
            console.log('✅ Created profile for Dr. Smith');
        } else {
            console.log('⏭️  Dr. Smith exists');
        }

        // Dr. Johnson
        const drJohnsonInit = await prisma.user.findUnique({ where: { email: 'dr.johnson@mediconsult.com' }, include: { doctorProfile: true } });
        if (!drJohnsonInit) {
            const newDr = await prisma.user.create({
                data: { email: 'dr.johnson@mediconsult.com', password: hashedPassword, name: 'Dr. Michael Johnson', role: 'DOCTOR', phone: '+1234567892' },
            });
            const existingProfile = await prisma.doctorProfile.findUnique({ where: { registrationNumber: 'MED-2024-002' } });
            if (!existingProfile) {
                await prisma.doctorProfile.create({
                    data: { userId: newDr.id, registrationNumber: 'MED-2024-002', specialization: 'Cardiology', qualifications: 'MBBS, MD, DM', isVerified: true, verifiedAt: new Date(), yearsOfExperience: 15 },
                });
            }
            console.log('✅ Created Dr. Johnson');
        } else if (!drJohnsonInit.doctorProfile) {
            const existingProfile = await prisma.doctorProfile.findUnique({ where: { registrationNumber: 'MED-2024-002' } });
            if (!existingProfile) {
                await prisma.doctorProfile.create({
                    data: { userId: drJohnsonInit.id, registrationNumber: 'MED-2024-002', specialization: 'Cardiology', qualifications: 'MBBS, MD, DM', isVerified: true, verifiedAt: new Date(), yearsOfExperience: 15 },
                });
                console.log('✅ Created profile for Dr. Johnson');
            }
        } else {
            console.log('⏭️  Dr. Johnson exists');
        }

        // Dr. Patel
        const drPatelInit = await prisma.user.findUnique({ where: { email: 'dr.patel@mediconsult.com' }, include: { doctorProfile: true } });
        if (!drPatelInit) {
            const newDr = await prisma.user.create({
                data: { email: 'dr.patel@mediconsult.com', password: hashedPassword, name: 'Dr. Priya Patel', role: 'DOCTOR', phone: '+1234567893' },
            });
            const existingProfile = await prisma.doctorProfile.findUnique({ where: { registrationNumber: 'MED-2024-003' } });
            if (!existingProfile) {
                await prisma.doctorProfile.create({
                    data: { userId: newDr.id, registrationNumber: 'MED-2024-003', specialization: 'Pediatrics', qualifications: 'MBBS, MD', isVerified: false, yearsOfExperience: 5 },
                });
            }
            console.log('✅ Created Dr. Patel');
        } else if (!drPatelInit.doctorProfile) {
            const existingProfile = await prisma.doctorProfile.findUnique({ where: { registrationNumber: 'MED-2024-003' } });
            if (!existingProfile) {
                await prisma.doctorProfile.create({
                    data: { userId: drPatelInit.id, registrationNumber: 'MED-2024-003', specialization: 'Pediatrics', qualifications: 'MBBS, MD', isVerified: false, yearsOfExperience: 5 },
                });
                console.log('✅ Created profile for Dr. Patel');
            }
        } else {
            console.log('⏭️  Dr. Patel exists');
        }

        // Patients
        const patients = [
            { email: 'patient@example.com', name: 'John Doe', phone: '+1234567894' },
            { email: 'jane.patient@example.com', name: 'Jane Williams', phone: '+1234567895' },
            { email: 'bob.patient@example.com', name: 'Bob Anderson', phone: '+1234567896' },
        ];

        for (const p of patients) {
            const existing = await prisma.user.findUnique({ where: { email: p.email } });
            if (!existing) {
                await prisma.user.create({
                    data: { email: p.email, password: hashedPassword, name: p.name, role: 'PATIENT', phone: p.phone },
                });
                console.log(`✅ Created ${p.name}`);
            } else {
                console.log(`⏭️  ${p.name} exists`);
            }
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n🔑 Test Credentials (password: password123):');
        console.log('- Admin: admin@mediconsult.com');
        console.log('- Doctor: dr.smith@mediconsult.com');
        console.log('- Doctor: dr.johnson@mediconsult.com');
        console.log('- Doctor (Unverified): dr.patel@mediconsult.com');
        console.log('- Patient: patient@example.com');
        console.log('- Patient: jane.patient@example.com');
        console.log('- Patient: bob.patient@example.com');
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

main()
    .catch(() => process.exit(1))
    .finally(async () => await prisma.$disconnect());
