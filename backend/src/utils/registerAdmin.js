const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();

// ⬇️ UBAH DETAIL AKUN ADMIN BARU DI SINI ⬇️
const newAdmin = {
  username: 'Admin Anggrek',
  email: 'admin.anggrek@binus.ac.id',
  password: 'passwordAnggrek123', // Silakan ganti dengan password yang diinginkan
};

async function main() {
  console.log('🌱 Memulai registrasi akun admin baru...\n');

  if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
    console.error('❌ Harap lengkapi username, email, dan password pada script!');
    process.exit(1);
  }

  // Cek apakah email sudah terdaftar
  const existing = await prisma.admin.findUnique({
    where: { email: newAdmin.email },
  });

  if (existing) {
    console.error(`❌ Akun admin dengan email ${newAdmin.email} sudah terdaftar sebelumnya!`);
    process.exit(1);
  }

  // Enkripsi password
  const passwordHash = await bcrypt.hash(newAdmin.password, 10);

  // Simpan admin baru ke database
  const admin = await prisma.admin.create({
    data: {
      username: newAdmin.username,
      email: newAdmin.email,
      password_hash: passwordHash,
    },
  });

  console.log('==============================================');
  console.log('✅ AKUN ADMIN BARU BERHASIL DIBUAT!');
  console.log('==============================================');
  console.log(`👤 Username : ${admin.username}`);
  console.log(`📧 Email    : ${admin.email}`);
  console.log(`🔑 Password : ${newAdmin.password}`);
  console.log('==============================================');
}

main()
  .catch((error) => {
    console.error('❌ Terjadi kesalahan saat registrasi:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
