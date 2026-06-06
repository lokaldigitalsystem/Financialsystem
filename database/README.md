# Financial System Database Module

Folder ini berisi blueprint dan instruksi untuk menyiapkan infrastruktur database aplikasi.

## Isi Folder:
- `schema.sql`: Script SQL untuk membuat tabel, indeks, dan aturan keamanan (RLS) di Supabase/PostgreSQL.
- `DATABASE_INSTRUCTIONS.md`: Panduan langkah-demi-langkah cara menghubungkan aplikasi dengan dashboard Supabase.

## Ringkasan Struktur:
Database menggunakan pola **Universal Store** di mana semua modul disimpan dalam tabel `koperasi_store`. Data dikategorikan berdasarkan `collection` untuk menjaga efisiensi dan kemudahan pengembangan (schema-less approach dalam PostgreSQL).

Jika Anda membutuhkan bantuan lebih lanjut mengenai query database, silakan hubungi tim dukungan sistem.
