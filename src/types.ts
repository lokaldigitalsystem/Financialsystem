/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CoaKategori {
  Aset = "Aset",
  Kewajiban = "Kewajiban",
  Ekuitas = "Ekuitas",
  Pendapatan = "Pendapatan",
  Beban = "Beban"
}

export enum SaldoNormal {
  Debet = "Debet",
  Kredit = "Kredit"
}

export interface CoaAccount {
  kode: string;
  nama: string;
  kategori: CoaKategori;
  normal: SaldoNormal;
  saldo: number;
  saldoAwal?: number;
}

export interface JurnalEntry {
  id: string;
  tgl: string;
  no: string;
  ket: string;
  akun: string;
  debet: number;
  kredit: number;
}

export interface StokItem {
  id: string;
  kode: string;
  nama: string;
  hargaJual: number;
  qty: number;
  hargaModal?: number;
}

export interface StokHistoriEntry {
  id: string;
  tgl: string;
  stokId: string;
  kodeBarang: string;
  namaBarang: string;
  qtySecaraFisik: number; // qty added or changed to
  qtyAdded: number; // net added qty
  hargaModal: number; // buying price / modal
  keterangan: string; // e.g. "Restok Barang", "Inisialisasi", "Penyesuaian qty"
}

export interface Anggota {
  id: string;
  nama: string;
  alamat: string;
  status: "Aktif" | "Non-Aktif";
  simpananPokok: number;
  jenisKelamin?: "Laki-laki" | "Perempuan";
  noHp?: string;
  email?: string;
  tipe?: "Biasa" | "Luar Biasa";
  foto?: string; // Base64 data URL string for member profile photo
}

export interface Tagihan {
  id: string;
  anggotaId: string;
  anggotaNama: string;
  kategori: string; // "Simpanan Wajib" | "Iuran Bulanan" | "Tagihan Pupuk / Barang" | "Jasa Finansial" | "Lain-lain"
  jumlah: number;
  tglTagihan: string;
  keterangan: string;
  status: "Belum Bayar" | "Lunas";
}

export interface RekeningBank {
  id: string;
  nama: string;
  nomorRekening: string;
  lokasiText: string;
  saldo: number;
  status?: "Aktif" | "Tidak Aktif";
}

export interface FixedAsset {
  id: string;
  nama: string;
  kategori: "Peralatan" | "Kendaraan" | "Mesin" | "Gedung & Bangunan" | "Tanah" | "Lainnya";
  tglPerolehan: string;
  hargaPerolehan: number;
  nilaiResidu: number;
  umurEkonomis: number; // years
  metodePenyusutan: "Garis Lurus" | "Saldo Menurun" | "Tanpa Penyusutan";
  akumulasiPenyusutan: number; // Accumulated depreciation so far
  status: "Aktif" | "Dilepas";
  tglPelepasan?: string;
  hargaPelepasan?: number;
  nilaiBukuPelepasan?: number;
  untungRugiPelepasan?: number; // gain or loss
  keteranganDisposal?: string;
  akunKasPelepasan?: string;
}

export interface KontakLain {
  id: string;
  nama: string;
  tipe: "Karyawan" | "Supplier" | "Pelanggan";
  noHp?: string;
  email?: string;
  alamat?: string;
  jabatanAtauPerusahaan?: string; // e.g. "Kasir", "Sales PT Maju", "Retailer"
  status: "Aktif" | "Non-Aktif";
  foto?: string; // Base64 data URL string for profile photo
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  amount: number;
  date: string;
  method: string;
  package: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: "Trial" | "Basic" | "Premium" | "Enterprise";
  status: "Active" | "Suspended" | "Trial";
  monthlyRate?: number;
  validUntil: string;
  createdAt: string;
  customFeatures?: string[];
}

export interface TenantInvoice {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: "Trial" | "Basic" | "Premium" | "Enterprise";
  amount: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: "Lunas" | "Belum Bayar" | "Jatuh Tempo";
  paymentMethod?: string;
  paymentDate?: string;
  paymentProofUrl?: string;
  paymentNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  tenantId: string;
  tenantName: string;
  actorEmail: string;
  actorName: string;
  category: "Autentikasi" | "Hak Akses" | "Reset Data" | "Mutasi Keuangan" | "Sistem & Langganan" | "Keamanan";
  severity: "INFO" | "WARNING" | "CRITICAL";
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "Sukses" | "Gagal" | "Dibatalkan" | "Ditolak";
}


