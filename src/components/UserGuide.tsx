import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  ListTodo, 
  Notebook, 
  Boxes, 
  Users, 
  Coins, 
  Settings, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Info,
  Scale,
  Landmark,
  TrendingUp,
  FileText,
  RotateCcw,
  Zap,
  Check,
  ChevronRight,
  Database,
  ArrowUpDown
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  category: 'core' | 'finance' | 'logistic' | 'integration';
  tags: string[];
  content: React.ReactNode;
}

export function UserGuide() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simStep, setSimStep] = useState<number>(0);
  const [selectedScenario, setSelectedScenario] = useState<string>('penjualan');

  // Interactive transaction simulator states
  const runSimulatorStep = (step: number) => {
    setSimStep(step);
  };

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: '1. Ringkasan & Arsitektur Otomatisasi',
      icon: Zap,
      category: 'integration',
      tags: ['arsitektur', 'otomatisasi', 'koneksi', 'dashboard'],
      content: (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-red-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-red-500 animate-pulse" />
              Sistem Satu-Pintu Koperasi Kreatif (Integrated Core System)
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Aplikasi ini dirancang dengan arsitektur <b>Real-time Single-ledger</b>. Setiap tindakan operasional (seperti penjualan kasir, retur pembelian, pendaftaran anggota, atau simpan-pinjam) secara otomatis memicu penjurnalan ganda dan memperbarui saldo buku besar terkait, inventaris stok, serta laporan keuangan (Neraca, Laba Rugi, &amp; Arus Kas) secara instan tanpa perlu posting manual akhir bulan.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Peta Aliran Otomatisasi (Data-Flow Integration)
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                <div className="font-extrabold text-xs text-red-600 dark:text-red-400 mb-1">LANGKAH 1: OPERASIONAL</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pengguna menginput transaksi di modul aktif: Kasir Penjualan, Retur Pembelian, Setoran Simpanan, Mutasi Kas, atau Pembayaran Pinjaman.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                <div className="absolute top-1/2 -left-3 -translate-y-1/2 hidden md:block text-slate-300 dark:text-slate-700">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 mb-1">LANGKAH 2: AUTO-LEGERING</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Sistem mengekstrak kode akun COA yang terkonfigurasi, lalu menulis baris <b>Debet &amp; Kredit</b> secara simetris ke Jurnal Umum &amp; Buku Besar.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                <div className="absolute top-1/2 -left-3 -translate-y-1/2 hidden md:block text-slate-300 dark:text-slate-700">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 mb-1">LANGKAH 3: SYNCHRONIZATION</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Laporan Neraca, Laba Rugi, dan Arus Kas memperbarui rumusnya secara langsung. Anggota mendapatkan rekap pinjaman &amp; porsi SHU terupdate.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulator */}
          <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Play className="h-4 w-4 text-red-500 fill-current" />
                  Simulator Aliran Jurnal Otomatis (Interactive Engine)
                </h5>
                <p className="text-xs text-slate-500">Pilih skenario di bawah untuk melihat bagaimana sistem merespon di balik layar</p>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => { setSelectedScenario('penjualan'); setSimStep(0); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${selectedScenario === 'penjualan' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  Penjualan Kasir
                </button>
                <button 
                  onClick={() => { setSelectedScenario('retur'); setSimStep(0); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${selectedScenario === 'retur' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  Retur Pembelian
                </button>
                <button 
                  onClick={() => { setSelectedScenario('simpanan'); setSimStep(0); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${selectedScenario === 'simpanan' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  Setor Wajib
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedScenario === 'penjualan' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-400 uppercase">Input Operasional</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Penjualan Tunai di Kasir: 1 pc Indomie Goreng senilai Rp 3.500 (Harga Modal / HPP = Rp 2.800)
                      </div>
                    </div>
                    <button 
                      onClick={() => runSimulatorStep(simStep === 0 ? 1 : simStep === 1 ? 2 : 0)}
                      className="px-4 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-lg hover:bg-red-700 flex items-center gap-1 shrink-0"
                    >
                      {simStep === 0 ? "Jalankan Jurnal" : simStep === 1 ? "Lihat Update Neraca" : "Ulangi"}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {simStep >= 1 && (
                      <div className="space-y-3">
                        <div className="border border-indigo-500/30 bg-indigo-500/5 p-4 rounded-xl">
                          <h6 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Jurnal Otomatis yang Terbentuk (Double-Entry Ledger)
                          </h6>
                          <div className="font-mono text-xs overflow-x-auto space-y-1 bg-slate-900 text-slate-100 p-3 rounded-lg">
                            <div className="grid grid-cols-4 gap-2 border-b border-slate-700 pb-1 font-bold text-slate-400">
                              <div>Tanggal</div>
                              <div>Nama Akun (COA)</div>
                              <div className="text-right">Debet (Rp)</div>
                              <div className="text-right">Kredit (Rp)</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                              <div>09/06/2026</div>
                              <div className="text-emerald-400">11100 - Kas Tunai Koperasi</div>
                              <div className="text-right text-emerald-400">3.500</div>
                              <div className="text-right">-</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>09/06/2026</div>
                              <div className="pl-4 text-slate-400">41100 - Pendapatan Usaha Penjualan</div>
                              <div className="text-right">-</div>
                              <div className="text-right text-emerald-400">3.500</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                              <div>09/06/2026</div>
                              <div className="text-amber-400">51100 - Harga Pokok Penjualan (HPP)</div>
                              <div className="text-right text-amber-400">2.800</div>
                              <div className="text-right">-</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>09/06/2026</div>
                              <div className="pl-4 text-slate-400">11300 - Persediaan Stok Barang</div>
                              <div className="text-right">-</div>
                              <div className="text-right text-amber-400">2.800</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {simStep >= 2 && (
                      <div className="border border-emerald-500/30 bg-emerald-500/5 p-4 rounded-xl">
                        <h6 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Laporan Keuangan Diperbarui Instan (Instant Trial Balance)
                        </h6>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                          <li><b>Persediaan Akhir Gedung:</b> Berkurang senilai HPP <b>(Rp 2.800)</b>.</li>
                          <li><b>Kas &amp; Bank:</b> Bertambah senilai Penjualan <b>(Rp 3.500)</b>.</li>
                          <li><b>Laba Bersih (SHU Sementara):</b> Meningkat sebesar selisihnya <b>(Rp +700)</b>.</li>
                          <li><b>Arus Kas:</b> Aliran operasional masuk tercatat senilai <b>Rp 3.500</b>.</li>
                        </ul>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {selectedScenario === 'retur' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-400 uppercase">Input Operasional</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Retur Pembelian Barang Rusak ke Supplier: 5 pcs Mie Instan senilai total Rp 15.000 ke Akun Kas Tunai
                      </div>
                    </div>
                    <button 
                      onClick={() => runSimulatorStep(simStep === 0 ? 1 : simStep === 1 ? 2 : 0)}
                      className="px-4 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-lg hover:bg-red-700 flex items-center gap-1 shrink-0"
                    >
                      {simStep === 0 ? "Jalankan Jurnal" : simStep === 1 ? "Lihat Update Neraca" : "Ulangi"}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {simStep >= 1 && (
                      <div className="space-y-3">
                        <div className="border border-indigo-500/30 bg-indigo-500/5 p-4 rounded-xl">
                          <h6 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Jurnal Otomatis yang Terbentuk (Double-Entry Ledger)
                          </h6>
                          <div className="font-mono text-xs overflow-x-auto space-y-1 bg-slate-900 text-slate-100 p-3 rounded-lg">
                            <div className="grid grid-cols-4 gap-2 border-b border-slate-700 pb-1 font-bold text-slate-400">
                              <div>Tanggal</div>
                              <div>Nama Akun (COA)</div>
                              <div className="text-right">Debet (Rp)</div>
                              <div className="text-right">Kredit (Rp)</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                              <div>09/06/2026</div>
                              <div className="text-emerald-400">11100 - Kas Tunai Koperasi</div>
                              <div className="text-right text-emerald-400">15.000</div>
                              <div className="text-right">-</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>09/06/2026</div>
                              <div className="pl-4 text-slate-400">11300 - Persediaan Stok Barang</div>
                              <div className="text-right">-</div>
                              <div className="text-right text-emerald-400">15.000</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {simStep >= 2 && (
                      <div className="border border-emerald-500/30 bg-emerald-500/5 p-4 rounded-xl">
                        <h6 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Laporan Keuangan Diperbarui Instan (Instant Trial Balance)
                        </h6>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                          <li><b>Persediaan Akhir Gudang:</b> Berkurang senilai total modal atau barang keluar <b>(Rp 15.000)</b>.</li>
                          <li><b>Kas Koperasi:</b> Bertambah / dikreditkan kembali dari Supplier <b>(Rp 15.000)</b>.</li>
                          <li><b>Log Audit Stok:</b> Secara otomatis mencatat log mutasi barang keluar jenis <i>"Retur Pembelian"</i>.</li>
                        </ul>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {selectedScenario === 'simpanan' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-400 uppercase">Input Operasional</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Setoran Simpanan Wajib Anggota (Bpk. Ahmad): Simpanan Wajib Tunai Rp 50.000
                      </div>
                    </div>
                    <button 
                      onClick={() => runSimulatorStep(simStep === 0 ? 1 : simStep === 1 ? 2 : 0)}
                      className="px-4 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-lg hover:bg-red-700 flex items-center gap-1 shrink-0"
                    >
                      {simStep === 0 ? "Jalankan Jurnal" : simStep === 1 ? "Lihat Update Neraca" : "Ulangi"}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {simStep >= 1 && (
                      <div className="space-y-3">
                        <div className="border border-indigo-500/30 bg-indigo-500/5 p-4 rounded-xl">
                          <h6 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Jurnal Otomatis yang Terbentuk (Double-Entry Ledger)
                          </h6>
                          <div className="font-mono text-xs overflow-x-auto space-y-1 bg-slate-900 text-slate-100 p-3 rounded-lg">
                            <div className="grid grid-cols-4 gap-2 border-b border-slate-700 pb-1 font-bold text-slate-400">
                              <div>Tanggal</div>
                              <div>Nama Akun (COA)</div>
                              <div className="text-right">Debet (Rp)</div>
                              <div className="text-right">Kredit (Rp)</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                              <div>09/06/2026</div>
                              <div className="text-emerald-400">11100 - Kas Tunai Koperasi</div>
                              <div className="text-right text-emerald-400">50.000</div>
                              <div className="text-right">-</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>09/06/2026</div>
                              <div className="pl-4 text-slate-400">21100 - Simpanan Wajib Anggota (Liabilitas Lancar)</div>
                              <div className="text-right">-</div>
                              <div className="text-right text-emerald-400">50.000</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {simStep >= 2 && (
                      <div className="border border-emerald-500/30 bg-emerald-500/5 p-4 rounded-xl">
                        <h6 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Laporan Keuangan Diperbarui Instan (Instant Trial Balance)
                        </h6>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                          <li><b>Kas Koperasi:</b> Bertambah / didebet sebesar <b>Rp 50.000</b> (Aset meningkat).</li>
                          <li><b>Buku Simpanan Anggota:</b> Akun Bpk. Ahmad mencatat tambahan Simpanan Wajib <b>Rp 50.000</b>.</li>
                          <li><b>Simpanan Wajib Coa (Liabilitas):</b> Bertambah di sisi Kredit sebesar <b>Rp 50.000</b> (Neraca tetap seimbang!).</li>
                        </ul>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'coa',
      title: '2. Bagan Akun (COA) & Saldo Normal',
      icon: ListTodo,
      category: 'finance',
      tags: ['coa', 'chart of accounts', 'akun', 'saldo normal'],
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Modul <b>Bagan Akun (Chart of Accounts - COA)</b> memetakan seluruh wadah transaksi koperasi. Pemahaman atas klasifikasi nomor akun penting untuk menjaga ketepatan laporan keuangan otomatis.
          </p>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Kepala Nomor</th>
                  <th className="p-3">Kategori Akun</th>
                  <th className="p-3">Saldo Normal</th>
                  <th className="p-3">Dampak Bertambah</th>
                  <th className="p-3">Dampak Berkurang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono">
                <tr>
                  <td className="p-3 font-bold text-red-600 dark:text-red-400">1xxxx</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">Aktiva (Aset / Kas / Barang)</td>
                  <td className="p-3">Debet</td>
                  <td className="p-3 text-emerald-600">Debet</td>
                  <td className="p-3 text-red-600">Kredit</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-600 dark:text-red-400">2xxxx</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">Kewajiban (Utang / Simpanan)</td>
                  <td className="p-3">Kredit</td>
                  <td className="p-3 text-emerald-600">Kredit</td>
                  <td className="p-3 text-red-600">Debet</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-600 dark:text-red-400">3xxxx</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">Ekuitas (Modal Anggota / Modal RAT)</td>
                  <td className="p-3">Kredit</td>
                  <td className="p-3 text-emerald-600">Kredit</td>
                  <td className="p-3 text-red-600">Debet</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-600 dark:text-red-400">4xxxx</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">Pendapatan (Penjualan / Bunga / Jasa)</td>
                  <td className="p-3">Kredit</td>
                  <td className="p-3 text-emerald-600">Kredit</td>
                  <td className="p-3 text-red-600">Debet</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-600 dark:text-red-400">5xxxx</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">Beban (Biaya Operasional / HPP)</td>
                  <td className="p-3">Debet</td>
                  <td className="p-3 text-emerald-600">Debet</td>
                  <td className="p-3 text-red-600">Kredit</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <Info className="h-4 w-4 shrink-0" /> Aturan Validasi Akun Koperasi
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Jangan menghapus akun bawaan sistem sebelum memeriksa keterkaitan rumus. Misalnya, akun <b>11300 (Persediaan)</b> digunakan untuk transaksi kasir otomatis. Akun <b>21100 s.d 21300</b> menyimpan data Simpanan Pokok/Wajib/Sukarela secara langsung dari modul Anggota.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'journaling',
      title: '3. Jurnal Umum & Buku Besar (Dipisah!)',
      icon: Notebook,
      category: 'finance',
      tags: ['jurnal umum', 'buku besar', 'jurnal', 'posting'],
      content: (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
            <Info className="h-8 w-8 text-indigo-500 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <b>Pemberitahuan Update Terkini:</b> Sesuai permintaan pengguna, <b>Jurnal Umum</b> dan <b>Buku Besar</b> sekarang dipisahkan secara struktural dalam halaman, lembar export Excel, maupun proses pilih filter pengeluaran laporan. Hal ini memudahkan auditor melakukan pemeriksaan silang (cross-auditing).
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">Perbedaan Fungsional Kedua Modul:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Jurnal Umum (General Journal)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Menampilkan kronologis waktu transaksi harian secara lengkap. Menunjuk debitur/kreditur, nomor bukti transaksi harian, dan keterangan detail. Berfungsi untuk penyesuaian non-otomatis (Manual Adjustment).
                </p>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Aksi Praktis:</div>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 dark:text-slate-400">
                  <li>Gunakan tombol "Add Jurnal Manual" untuk transaksi unik (misal: penyusutan properti, beban utilitas).</li>
                  <li>Masukkan nomor bukti yang jelas agar terekap otomatis di Buku Besar.</li>
                </ul>
              </div>

              <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Buku Besar (Ledger)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Buku Besar mengelompokkan riwayat mutasi berdasarkan <b>masing-masing akun spesifik</b> (Membongkar per COA). Memudahkan Anda melihat saldo kumulatif kas saja, piutang saja, atau pendapatan saja secara spesifik per periode.
                </p>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Aksi Praktis:</div>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 dark:text-slate-400">
                  <li>Gunakan dropdown penyaring Akun COA di pojok kanan atas Buku Besar.</li>
                  <li>Sistem akan menyajikan riwayat debet, kredit, beserta saldo berjalan (running balance) akun tersebut.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'membership',
      title: '4. Anggota, Simpanan, Pinjaman & SHU',
      icon: Users,
      category: 'core',
      tags: ['anggota', 'simpanan', 'pinjaman', 'shu', 'rat'],
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Modul Anggota mengelola tiga pilar utama koperasi Indonesia: <b>Daftar Keanggotaan</b>, <b>Buku Simpanan (Pokok, Wajib, Sukarela)</b>, dan <b>Manajemen Kredit Pinjaman</b>. Seluruh aktivitas finansial di sini memiliki keterpaduan dengan pembukuan utama.
          </p>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Pembagian Alur RAT &amp; Distribusi SHU (Anggota Payout)
            </h5>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Distribusi Hak Payout SHU Anggota Otomatis
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ketika Sisa Hasil Usaha (SHU) koperasi didistribusikan pada forum RAT, sistem secara otomatis menghitung rekap simpanan historis dan nominal belanja anggota lunas. Rasio persentase yang diatur di Pengaturan (misal: Jasa Modal 20%, Jasa Anggota 25%) akan menetapkan hak pembagian rupiah anggota secara proporsional.
              </p>
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1">
                <div><b>Hak Jasa Modal Anggota A</b> = (Simpanan Anggota A / Total Simpanan Semua Anggota) × Total Alokasi Jasa Modal</div>
                <div><b>Hak Jasa Usaha Anggota A</b> = (Total Belanja Anggota A / Total Belanja Selesai Semua Anggota) × Total Alokasi Jasa Usaha</div>
                <div className="text-red-600 dark:text-red-400 font-bold mt-1">Total Hak SHU Diterima Anggota A = Hak Jasa Modal + Hak Jasa Usaha</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Prosedur Kasir Otomatis Ke Buku Pembantu Simpanan:
            </h5>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal pl-4">
              <li>Pilih Anggota yang menyetor langsung dari tab Anggota untuk menambahkan nominal "Simpanan Pokok/Wajib/Sukarela".</li>
              <li>Pilih metode kas pembayar (misal: Kas Tunai).</li>
              <li>Sistem akan mencatat saldo pembantu anggota bersangkutan, meningkatkan total simpanan koperasi, sekaligus membuat jurnal penentu di sisi kiri Buku Besar secara paralel.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'gudang',
      title: '5. Manajemen Stok, Logistik & Retur Pembelian',
      icon: Boxes,
      category: 'logistic',
      tags: ['stok', 'logistik', 'barang', 'gudang', 'opname', 'retur'],
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Menyatukan fungsi pergudangan logistik dengan modul kasir penjualan Point of Sale (POS) koperasi, termasuk fungsi audit opname fisik dan penanganan retur supplier.
          </p>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Fitur Utama Logistik &amp; Gudang:
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Stock Opname Fisik</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Membandingkan jumlah tercatat komputer dengan stok nyata di rak gudang. Selisih (kurang/lebih) akan menghasilkan otomatisasi penyesuaian nilai persediaan COA dan penulisan log audit logistik.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Retur Pembelian (Purchase Return)</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Apabila barang dagangan yang dipesan dari pemasok rusak, Anda dapat mengajukan retur di tab ini. Stok barang terkait akan ditarik keluar dari inventaris komputer, dan nilai klaim akan menaikkan Kas Koperasi ataupun mengurangi kewajiban hutang secara terpadu.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <Info className="h-4 w-4 shrink-0" /> Aturan Otomatisasi HPP (Harga Pokok Penjualan)
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Setiap kali Anda mengubah kuantitas persediaan di program kasir, sistem mengkalkulasi HPP kumulatif. Pastikan kolom "Harga Modal" barang diisi dengan benar agar sistem dapat menghitung profit kotor penjualan secara valid dan akurat.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: '6. Pelaporan & Ekspor Konsolidasi Excel',
      icon: Coins,
      category: 'integration',
      tags: ['laporan', 'export', 'excel', 'pembagian shu', 'rekap simpanan', 'rekap pinjaman', 'stok logistik'],
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Aplikasi menyediakan halaman penarikan laporan komprehensif. Tombol <b>"Export Konsolidasi ke Excel"</b> menghasilkan workbook `.xlsx` multi-sheet instan untuk pelaporan rapat pengurus maupun rapat RAT.
          </p>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Daftar Workbook Excel Konsolidasi (Sheet yang Dipisah)
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sesuai dengan standarisasi terbaru untuk menghindari kerumitan, file ekspor Excel Anda akan memuat sheet-sheet terpisah berikut ini (tergantung dari tanda centang checklist ekspor Anda):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {[
                "Daftar Akun (COA)",
                "Jurnal Umum (Kronologis)",
                "Buku Besar (Grouped)",
                "Database Anggota",
                "Saldo Kas & Bank",
                "Laporan Laba Rugi",
                "Laporan Neraca",
                "Laporan Arus Kas",
                "Buku Pembagian SHU RAT",
                "Rekap Simpanan Anggota",
                "Rekap Pinjaman Aktif",
                "Inventaris Stok & Logistik"
              ].map((sheet, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {sheet}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-705 dark:text-slate-205 uppercase tracking-wider">
              Laporan Keuangan yang Tidak Muncul di Bundle Default:
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Untuk menyederhanakan pelaporan standar, file <b>"Default Bundle PDF/Print"</b> hanya menyajikan Laba Rugi &amp; Neraca. Sementara detail operasional lain seperti Stok Logistik, Pembagian SHU RAT Per Anggota, Rekap Simpanan, Rekap Pinjaman, dan Arus Kas, <b>dibuat terpisah di tab sheet tersendiri</b> pada ekspor excel dan dapat disaring menggunakan checklist filter di menu Laporan Keuangan sebelum diekspor.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: '7. Keamanan Sistem & Jejak Audit (Security Audit)',
      icon: ShieldCheck,
      category: 'integration',
      tags: ['keamanan', 'audit trail', 'role', 'admin', 'auth'],
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Menjamin transparansi pembukuan melalui pencatatan aktivitas terpusat, kontrol hak akses bertingkat, dan notifikasi ancaman real-time.
          </p>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Sistem Leveling &amp; Hak Akses Pengguna (Role Permission):
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl space-y-1">
                <div className="font-bold text-xs text-rose-700 dark:text-rose-400">1. SuperIT / Owner</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hak penuh sistem. Mengelola lisensi sewa, backup database cloud, memutus keamanan (Unlocks), melakukan impersonasi log, serta bypass bypass pemeliharaan cloud.
                </p>
              </div>

              <div className="p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-xl space-y-1">
                <div className="font-bold text-xs text-indigo-700 dark:text-indigo-400">2. Operator Admin</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dapat menginput jurnal, kasir harian, manajemen barang pergudangan, simpanan anggota, dan memproses klaim retur pembelian. Dibatasi dari konfigurasi kritis.
                </p>
              </div>

              <div className="p-4 border border-slate-300 dark:border-slate-800 bg-slate-500/5 rounded-xl space-y-1">
                <div className="font-bold text-xs text-slate-700 dark:text-slate-300">3. Auditor / Viewer</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hanya memiliki akses baca (Read-only). Diijinkan memantau Neraca, mereview Jurnal &amp; Buku Besar yang dipisah, serta mengunduh ekspor konsolidasi Excel untuk pelaporan rapat.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-1.5">
            <div className="text-xs font-extrabold text-slate-500 uppercase">Jejak Audit Keamanan (Security Audit Trail):</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Setiap kali pengguna melakukan aksi sensitif seperti menghapus jurnal, memotong simpanan, menihilkan stok opname, atau mengubah batasan sistem, aplikasi menyuntikkan entri unik ke dalam <b>Log Audit Keamanan Cloud</b>. Entri log ini dilindungi secara kriptografis di server cloud dan tidak dapat dimodifikasi bahkan oleh admin lokal untuk mencegah manipulasi data.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(sec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(query) ||
      sec.tags.some(tag => tag.includes(query))
    );
  });

  return (
    <div id="user-guide-container" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-indigo-700 p-6 sm:p-8 rounded-2xl text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <BookOpen className="h-64 w-64 text-white" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-red-100">
            Pusat Ilmu &amp; Bantuan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            Panduan Pengguna Interaktif (User Guide)
          </h2>
          <p className="text-xs sm:text-sm text-slate-100 max-w-2xl leading-relaxed">
            Selamat datang di panduan resmi aplikasi pengelolaan Koperasi. Temukan bantuan teknis mengenai Bagan Akun (COA), Penjurnal &amp; Buku Besar yang dipisah harian, alur pemrosesan simpanan, retur pembelian, audit stok gudang, otomatisasi RAT, hingga tata cara ekspor laporan ke Excel.
          </p>
        </div>
      </div>

      {/* Control Actions (Search & Quick Filter) */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari topik panduan (misal: Jurnal, RAT, Stok)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.8 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-800 hover:bg-slate-100'}`}
          >
            Arsitektur Otomatisasi
          </button>
          <button 
            onClick={() => setActiveTab('coa')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'coa' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-800 hover:bg-slate-100'}`}
          >
            Bagan Akun (COA)
          </button>
          <button 
            onClick={() => setActiveTab('journaling')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'journaling' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-800 hover:bg-slate-100'}`}
          >
            Jurnal &amp; Buku Besar
          </button>
          <button 
            onClick={() => setActiveTab('membership')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'membership' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-150 dark:border-slate-800 hover:bg-slate-100'}`}
          >
            Simpanan, Pinjaman &amp; SHU
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 lg:col-span-1 space-y-4">
          <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
            Topik Pembahasan
          </div>
          <nav className="flex flex-col gap-1">
            {sections.map((sec) => {
              const IconComponent = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => { setActiveTab(sec.id); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${activeTab === sec.id ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-150 dark:border-slate-800 pt-4 px-2 space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Butuh Hubungi IT Support?
            </h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika mengalami kendala teknis atau rekonsiliasi data tidak balance, harap layangkan tiket di menu <b>Pengaduan &amp; Bantuan</b>. Tim IT siap melayani 24 jam.
            </p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-3 min-h-[500px]">
          {searchQuery ? (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  Hasil Pencarian Topik: "{searchQuery}"
                </h3>
                <p className="text-xs text-slate-400">Ditemukan {filteredSections.length} topik yang cocok</p>
              </div>

              {filteredSections.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">Tidak ada topik yang cocok. Cari dengan kata kunci lain.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-6">
                  {filteredSections.map(sec => (
                    <div key={sec.id} className="pt-6 first:pt-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <sec.icon className="h-5 w-5 text-red-500" />
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{sec.title}</h4>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-xs pl-7 leading-relaxed">
                        {sec.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sections.filter(sec => sec.id === activeTab).map((sec) => (
                <div key={sec.id} className="space-y-4">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <sec.icon className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                      {sec.title}
                    </h3>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full uppercase tracking-wider">
                      {sec.category}
                    </span>
                  </div>
                  <div className="text-slate-705 dark:text-slate-300 text-xs leading-relaxed">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Common FAQ Scenarios Accordion */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          Pertanyaan Umum &amp; Penyelesaian Kasus Kontrol (FAQ &amp; Troubleshoot)
        </h4>
        
        <div id="faq-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Bagaimana cara mengedit atau menghapus Jurnal Umum?</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ganti akun pengguna ke hak Operator/Owner. Cari entri jurnal di tab **Jurnal Umum**. Klik tombol ikon tempat sampah di paling ujung kanan baris. Sistem secara otomatis meralat saldo Buku Besar pada akun yang berkaitan dan mencatat mutasi pengubahan di security audit.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Mengapa hasil Neraca saya bertanda "Tidak Balance"?</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Kondisi ini terjadi bila Anda melakukan penjurnalan manual yang tidak simetris (selisih nominal debet dan kredit tidak sama dengan 0). Cek kembali jurnal manual yang Anda buat di **Jurnal Umum** dan samakan besaran nilainya agar Laporan Neraca kembali seimbang otomatis.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Bagaimana cara memproses sisa pinjaman anggota yang keluar?</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Masuk ke menu Anggota, buat penarikan simpanan atau pelunasan pinjaman. Jurnal penyesuaian akan dibuat otomatis untuk mendebet Kas Tunai/Bank dan menihilkan saldo pinjaman aktif anggota bersangkutan di neraca terpadu.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Mengapa Retur Pembelian atau Stok Logistik tidak ikut diprint di bundle?</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sesuai kebijakan fungsional, laporan pergudangan logistik dan daftar retur disajikan secara terpisah di **Konsolidasi Laporan Excel** agar laporan buku kepengurusan inti tetap bersih, ringkas, dan bebas kesemrawutan data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
