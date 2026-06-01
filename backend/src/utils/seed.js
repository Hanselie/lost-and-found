require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // ─── Seed Admin ───
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@binus.ac.id' },
    update: {
      username: 'admin',
      password_hash: passwordHash,
    },
    create: {
      username: 'admin',
      email: 'admin@binus.ac.id',
      password_hash: passwordHash,
    },
  });

  console.log(`✅ Super Admin seeded: ${admin.username} (${admin.email})`);

  // Seed Branch Campus Admins
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

  for (const branchAdmin of branchAdmins) {
    const branchHash = await bcrypt.hash(branchAdmin.password, 10);
    const seededBranch = await prisma.admin.upsert({
      where: { email: branchAdmin.email },
      update: {
        username: branchAdmin.username,
        password_hash: branchHash,
      },
      create: {
        username: branchAdmin.username,
        email: branchAdmin.email,
        password_hash: branchHash,
      },
    });
    console.log(`✅ Branch Admin seeded: ${seededBranch.username} (${seededBranch.email})`);
  }

  // ─── Clear existing items ───
  await prisma.item.deleteMany({});
  console.log('🗑️  Existing items cleared.\n');

  // ─── Seed Items ───
  const items = [
    {
      title: 'Tas isi sepatu+kaos',
      category: 'Tas',
      building: 'Anggrek',
      location_detail: 'TW Admisi',
      date_found: new Date('2026-05-02'),
      status: 'AVAILABLE',
      internal_note: 'Tas plastik putih berisi sepatu olahraga dan kaos hitam.',
    },
    {
      title: 'Gelang Acc',
      category: 'Aksesoris',
      building: 'Syahdan',
      location_detail: 'Ruang 302',
      date_found: new Date('2026-05-05'),
      status: 'AVAILABLE',
      internal_note: null,
    },
    {
      title: 'Charger putih type-C',
      category: 'Elektronik',
      building: 'Anggrek',
      location_detail: 'Relax corner lt 5',
      date_found: new Date('2026-05-07'),
      status: 'RETURNED',
      internal_note: 'Dikembalikan ke mahasiswa pada 10 Mei 2026.',
    },
    {
      title: 'Dongle flashdisk',
      category: 'Elektronik',
      building: 'Kijang',
      location_detail: 'Ruang 424',
      date_found: new Date('2026-05-08'),
      status: 'AVAILABLE',
      internal_note: 'Flashdisk SanDisk 32GB warna hitam.',
    },
    {
      title: 'Jaket warna hitam',
      category: 'Pakaian',
      building: 'Alam Sutera',
      location_detail: 'Kantin lt 2',
      date_found: new Date('2026-05-10'),
      status: 'AVAILABLE',
      internal_note: null,
    },
    {
      title: 'Kacamata frame cokelat',
      category: 'Aksesoris',
      building: 'Syahdan',
      location_detail: 'Lobby utama',
      date_found: new Date('2026-05-12'),
      status: 'AVAILABLE',
      internal_note: 'Frame cokelat, lensa minus.',
    },
    {
      title: 'Tas warna biru',
      category: 'Tas',
      building: 'Anggrek',
      location_detail: 'Perpustakaan lt 3',
      date_found: new Date('2026-05-14'),
      status: 'RETURNED',
      internal_note: 'Diklaim oleh pemilik pada 16 Mei 2026.',
    },
    {
      title: 'Botol minum stainless',
      category: 'Botol Minum',
      building: 'Kijang',
      location_detail: 'Ruang 510',
      date_found: new Date('2026-05-18'),
      status: 'AVAILABLE',
      internal_note: null,
    },
    {
      title: 'Dompet hitam',
      category: 'Aksesoris',
      building: 'Alam Sutera',
      location_detail: 'Musholla lt 1',
      date_found: new Date('2026-05-20'),
      status: 'AVAILABLE',
      internal_note: 'Berisi KTP dan beberapa kartu, tidak ada uang tunai.',
    },
    {
      title: 'Payung lipat biru',
      category: 'Lainnya',
      building: 'Syahdan',
      location_detail: 'Lobby lt 1',
      date_found: new Date('2026-05-22'),
      status: 'AVAILABLE',
      internal_note: null,
    },
  ];

  for (const itemData of items) {
    const expiresAt = new Date(itemData.date_found);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const item = await prisma.item.create({
      data: {
        ...itemData,
        expires_at: expiresAt,
      },
    });

    console.log(`  📦 Item seeded: ${item.title} (${item.status})`);
  }

  console.log(`\n✅ Seed completed! ${items.length} items created.`);
  console.log('\n📌 Admin credentials:');
  console.log('   Email:    admin@binus.ac.id');
  console.log('   Password: admin123\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
