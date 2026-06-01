# 🔍 Campus Lost & Found — Backend API

Backend RESTful API untuk sistem Lost & Found kampus BINUS. Dibangun menggunakan **Node.js**, **Express**, **Prisma ORM**, dan **MySQL**.

---

## 📋 Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | >= 18.x |
| **npm** | >= 9.x |
| **MySQL** | >= 8.0 (via XAMPP atau standalone) |

---

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Buat Database MySQL

Buka **phpMyAdmin** (http://localhost/phpmyadmin) atau MySQL CLI, lalu buat database:

```sql
CREATE DATABASE lost_and_found;
```

### 3. Konfigurasi Environment

File `.env` sudah tersedia dengan konfigurasi default. Sesuaikan jika diperlukan:

```env
DATABASE_URL="mysql://root:@localhost:3306/lost_and_found"
JWT_SECRET="campus-lost-and-found-secret-key-2024-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5000"
```

### 4. Generate Prisma Client & Push Schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Data Awal

```bash
npm run seed
```

### 6. Jalankan Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di: **http://localhost:5000**

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login admin, set JWT cookie |
| `POST` | `/api/auth/logout` | ❌ | Logout, clear JWT cookie |
| `GET` | `/api/auth/check` | ✅ | Cek validitas token |

### Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/items` | ❌ | Ambil semua barang (publik, tanpa internal_note) |
| `GET` | `/api/items/admin` | ✅ | Ambil semua barang (admin, lengkap) |
| `GET` | `/api/items/stats` | ✅ | Ambil statistik dashboard |
| `GET` | `/api/items/:id` | ✅ | Ambil detail barang by ID |
| `POST` | `/api/items` | ✅ | Tambah barang baru |
| `PUT` | `/api/items/:id` | ✅ | Update barang |
| `DELETE` | `/api/items/:id` | ✅ | Hapus barang (soft delete) |
| `PATCH` | `/api/items/:id/status` | ✅ | Update status barang |

### Query Parameters (GET /api/items)

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Cari berdasarkan title (contains) |
| `building` | string | Filter berdasarkan gedung |
| `category` | string | Filter berdasarkan kategori |

### Response Format

Semua endpoint mengembalikan format JSON konsisten:

```json
{
  "success": true,
  "message": "Deskripsi hasil operasi.",
  "data": {}
}
```

---

## 🔐 Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@binus.ac.id` |
| Password | `admin123` |

> ⚠️ **Ganti password dan JWT_SECRET sebelum deploy ke production!**

---

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js   # Auth handlers
│   │   └── itemController.js   # Item CRUD handlers
│   ├── cron/
│   │   └── expiryJob.js        # Daily auto-expiry job
│   ├── middleware/
│   │   ├── auth.js             # JWT cookie verification
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validator.js        # Input validation & sanitization
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   └── itemRoutes.js       # Item endpoints
│   ├── services/
│   │   ├── authService.js      # bcrypt & JWT helpers
│   │   └── itemService.js      # Item business logic
│   ├── utils/
│   │   ├── response.js         # Response helpers
│   │   └── seed.js             # Database seeder
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
├── .env                        # Environment variables
├── package.json
└── README.md
```

---

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start with nodemon (auto-reload) |
| Start | `npm start` | Start production server |
| Seed | `npm run seed` | Seed database with sample data |
| Prisma Generate | `npm run prisma:generate` | Generate Prisma Client |
| Prisma Push | `npm run prisma:push` | Push schema to database |
| Prisma Studio | `npm run prisma:studio` | Open Prisma Studio GUI |

---

## ⏰ Auto-Expiry

Item dengan status `AVAILABLE` yang melewati `expires_at` (30 hari setelah `date_found`) akan otomatis diubah statusnya menjadi `EXPIRED` oleh cron job yang berjalan setiap hari pada pukul 00:00.

---

## 📝 License

MIT
