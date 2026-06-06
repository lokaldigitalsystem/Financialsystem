# Database System - Setup & Configuration

Aplikasi **Financial System** menggunakan **Supabase** sebagai sistem database utama (PostgreSQL). Database ini dirancang dengan pola *Multi-Tenant* di mana satu database dapat digunakan oleh banyak organisasi/instansi secara terpisah dan aman.

## 1. Komponen Utama
Sistem ini menggunakan satu tabel utama yang sangat fleksibel:
- **Tabel `koperasi_store`**: Menyimpan semua data modul (Stok, Jurnal, Penjualan, Keanggotaan, dll) dalam format JSONB.

## 2. Cara Persiapan Database (Supabase)

Jika Anda ingin memindahkan sistem ini ke project Supabase milik Anda sendiri:

1.  **Buat Project Baru** di [Supabase Dashboard](https://supabase.com).
2.  **SQL Editor**: Buka menu "SQL Editor" di dashboard Supabase.
3.  **Jalankan Schema**: Salin dan tempel isi file `database/schema.sql` ke SQL Editor, lalu klik **Run**.
4.  **Konfigurasi Environment**:
    - Dapatkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari Dashboard Supabase > Settings > API.
    - Masukkan nilai tersebut ke dalam file `.env` (atau di Settings applet ini) dengan nama:
      - `VITE_SUPABASE_URL`
      - `VITE_SUPABASE_ANON_KEY`

## 3. Struktur Koleksi (Data Modules)
Data diatur berdasarkan kolom `collection`. Beberapa koleksi yang digunakan adalah:
- `tenants`: Menyimpan profil organisasi/perusahaan.
- `stok`: Inventaris produk dan barang.
- `jurnal`: Catatan akuntansi (double-entry).
- `coa`: Chart of Accounts (klasifikasi akun).
- `anggota`: Database pelanggan atau anggota.
- `audit`: Log keamanan dan aktivitas sistem.

## 4. Keamanan (Row Level Security)
Tabel `koperasi_store` telah dilengkapi dengan kebijakan RLS. Pastikan Anda mengaktifkan **Email Confirmation** di Supabase Auth jika ingin mewajibkan verifikasi email sebelum user bisa mencatatkan data secara remote.

---
*Finacial System Database Module - prepared for production deployment.*
