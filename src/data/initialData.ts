/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoaAccount, CoaKategori, SaldoNormal, JurnalEntry, StokItem, Anggota, RekeningBank, StokHistoriEntry, KontakLain } from '../types';

export const INITIAL_COA: CoaAccount[] = [
  // ASET - KAS & SETARA KAS
  { kode: "1-1000", nama: "KAS & SETARA KAS", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1101", nama: "Kas Tunai", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1102", nama: "Bank BRI", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1103", nama: "Bank BNI", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1104", nama: "Bank BJB", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1105", nama: "Bank Mandiri", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1106", nama: "Bank BCA", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1107", nama: "Bank Syariah", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1108", nama: "Bank BTN", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },

  // ASET - PIUTANG
  { kode: "1-1200", nama: "PIUTANG", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1201", nama: "Piutang Anggota", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1202", nama: "Piutang Usaha (Dagang)", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1203", nama: "Piutang Lain-lain", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },

  // ASET - PERSEDIAAN
  { kode: "1-1300", nama: "PERSEDIAAN", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1301", nama: "Persediaan Barang Dagangan", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1302", nama: "Persediaan Bahan Baku", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },

  // ASET LANCAR LAINNYA & ASET TETAP
  { kode: "1-1400", nama: "ASET LANCAR LAINNYA", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1401", nama: "Biaya Dibayar Dimuka", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1402", nama: "Perlengkapan Kantor", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-1403", nama: "Simpanan di Koperasi Lain", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2000", nama: "ASET TETAP", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2101", nama: "Tanah", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2102", nama: "Gedung & Bangunan", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2103", nama: "Kendaraan", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2104", nama: "Peralatan Kantor", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2105", nama: "Peralatan Usaha", kategori: CoaKategori.Aset, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "1-2201", nama: "Akum. Penyusutan Gedung", kategori: CoaKategori.Aset, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "1-2202", nama: "Akum. Penyusutan Kendaraan", kategori: CoaKategori.Aset, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "1-2203", nama: "Akum. Penyusutan Peralatan", kategori: CoaKategori.Aset, normal: SaldoNormal.Kredit, saldo: 0 },

  // KEWAJIBAN LANCAR & JANGKA PANJANG
  { kode: "2-1000", nama: "KEWAJIBAN LANCAR (JANGKA PENDEK)", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1001", nama: "Hutang Dagang", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1002", nama: "Hutang PPN (VAT)", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1003", nama: "Simpanan Sukarela (Manasuka)", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1004", nama: "Hutang Pajak", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1005", nama: "Pendapatan Diterima Dimuka", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1006", nama: "Hutang Lain-lain", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-1007", nama: "Dana SHU", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-2000", nama: "KEWAJIBAN JANGKA PANJANG", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-2001", nama: "Hutang Bank", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-2002", nama: "Simpanan Berjangka Anggota", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "2-2003", nama: "Hutang Ke Pihak III", kategori: CoaKategori.Kewajiban, normal: SaldoNormal.Kredit, saldo: 0 },

  // EKUITAS
  { kode: "3-1001", nama: "Simpanan Pokok", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-1002", nama: "Simpanan Wajib", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-1003", nama: "Cadangan Umum", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-1004", nama: "Cadangan Risiko", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-1005", nama: "Donasi & Hibah", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-2001", nama: "SHU Tahun Sebelumnya", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "3-2002", nama: "SHU Tahun Berjalan", kategori: CoaKategori.Ekuitas, normal: SaldoNormal.Kredit, saldo: 0 },

  // PENDAPATAN
  { kode: "4-1000", nama: "PENDAPATAN USAHA UTAMA", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-1001", nama: "Pendapatan Penjualan Barang", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-1002", nama: "Jasa Simpan Pinjam", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-1003", nama: "Pendapatan Unit Usaha Lain", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-2000", nama: "PENDAPATAN LAIN-LAIN", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-2001", nama: "Pendapatan Bunga Bank", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-2002", nama: "Pendapatan Sewa", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },
  { kode: "4-2003", nama: "Pendapatan Lain-lain", kategori: CoaKategori.Pendapatan, normal: SaldoNormal.Kredit, saldo: 0 },

  // BEBAN (HPP & OPERASIONAL)
  { kode: "5-1001", nama: "Harga Pokok Penjualan (HPP)", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "5-1002", nama: "Potongan Penjualan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-1000", nama: "BEBAN PEGAWAI", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-1001", nama: "Beban Gaji Pengurus", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-1002", nama: "Beban Gaji Karyawan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-1003", nama: "Beban Tunjangan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2000", nama: "BEBAN UMUM & ADMINISTRASI", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2001", nama: "Beban ATK & Perlengkapan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2002", nama: "Beban Listrik & Air", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2003", nama: "Beban Telepon & Internet", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2004", nama: "Beban Sewa", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2005", nama: "Beban Penyusutan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2006", nama: "Beban Perbaikan & Perawatan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2007", nama: "Beban Transportasi", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2008", nama: "Beban Pajak & Perijinan", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2009", nama: "Beban Rapat & Representasi", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-2010", nama: "Beban Lain-lain", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 },
  { kode: "6-3001", nama: "Beban Bunga Bank", kategori: CoaKategori.Beban, normal: SaldoNormal.Debet, saldo: 0 }
];

export const INITIAL_JURNAL: JurnalEntry[] = [];

export const INITIAL_STOK: StokItem[] = [];

export const INITIAL_ANGGOTA: Anggota[] = [];

export const INITIAL_REKENING: RekeningBank[] = [
  { id: "bnk-1", nama: "Kas Tunai", nomorRekening: "Kas Tunai di Brankas", lokasiText: "Kantor Koperasi", saldo: 0 },
  { id: "bnk-2", nama: "Bank BRI", nomorRekening: "1234-01-002345-53-1", lokasiText: "BRI Cabang Cikampek", saldo: 0 },
  { id: "bnk-3", nama: "Bank BNI", nomorRekening: "0987-654-321-001", lokasiText: "BNI KCP Klari", saldo: 0 },
  { id: "bnk-4", nama: "Bank BJB", nomorRekening: "0012-3456-7890", lokasiText: "BJB Cabang Karawang", saldo: 0 },
  { id: "bnk-5", nama: "Bank Mandiri", nomorRekening: "173-00-112233-4", lokasiText: "Mandiri KC Cikampek", saldo: 0 },
  { id: "bnk-6", nama: "Bank BCA", nomorRekening: "842-556-9901", lokasiText: "BCA KCP Galuh Mas", saldo: 0 },
  { id: "bnk-7", nama: "Bank Syariah", nomorRekening: "711-2233-445", lokasiText: "BSI KCP Cikampek", saldo: 0 },
  { id: "bnk-8", nama: "Bank BTN", nomorRekening: "0011-55-9988", lokasiText: "BTN Cabang Karawang", saldo: 0 }
];

export const INITIAL_STOK_HISTORI: StokHistoriEntry[] = [];

export const INITIAL_KONTAK_LAIN: KontakLain[] = [];

