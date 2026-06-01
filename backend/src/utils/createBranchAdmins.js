const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();

const branchAdmins = [
  { username: 'Admin Anggrek', email: 'admin.anggrek@binus.ac.id', password: 'anggrek123' },
  { username: 'Admin Syahdan', email: 'admin.syahdan@binus.ac.id', password: 'syahdan123' },
  { username: 'Admin Kijang', email: 'admin.kijang@binus.ac.id', password: 'kijang123' },
  { username: 'Admin Alam Sutera', email: 'admin.alsut@binus.ac.id', password: 'alsut123' },
  { username: 'Admin Bekasi', email: 'admin.bekasi@binus.ac.id', password: 'bekasi123' },
  { username: 'Admin Bandung', email: 'admin.bandung@binus.ac.id', password: 'bandung123' },
  { username: 'Admin Malang', email: 'admin.malang@binus.ac.id', password: 'malang123' },
  { username: 'Admin Semarang', email: 'admin.semarang@binus.ac.id', password: 'semarang123' },
  { username: 'Admin Senayan', email: 'admin.senayan@binus.ac.id', password: 'senayan123' },
];

async function main() {
  console.log('🌱 Memulai pendaftaran akun admin cabang...\n');

  for (const newAdmin of branchAdmins) {
    const passwordHash = await bcrypt.hash(newAdmin.password, 10);

    const admin = await prisma.admin.upsert({
      where: { email: newAdmin.email },
      update: {
        username: newAdmin.username,
        password_hash: passwordHash,
      },
      create: {
        username: newAdmin.username,
        email: newAdmin.email,
        password_hash: passwordHash,
      },
    });

    console.log(`✅ Berhasil mendaftarkan/memperbarui: ${admin.username} (${admin.email})`);
  }

  console.log('\n🎉 Semua akun admin cabang berhasil terdaftar di database!');
}

main()
  .catch((error) => {
    console.error('❌ Terjadi kesalahan saat mendaftarkan admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
