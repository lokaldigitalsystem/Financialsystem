/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Plus, 
  Search, 
  Trash2, 
  Save, 
  Calendar,
  AlertCircle,
  Package,
  ArrowRightLeft,
  Banknote,
  ClipboardList
} from 'lucide-react';
import { StokItem, CoaAccount, PurchaseReturn } from '../types';

interface ReturPembelianProps {
  stokData: StokItem[];
  coaData: CoaAccount[];
  returData: PurchaseReturn[];
  onAddRetur: (retur: Omit<PurchaseReturn, 'id'>) => void;
  onDeleteRetur: (id: string) => void;
}

export function ReturPembelian({ 
  stokData, 
  coaData, 
  returData, 
  onAddRetur, 
  onDeleteRetur 
}: ReturPembelianProps) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [selectedStokId, setSelectedStokId] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [alasan, setAlasan] = useState('');
  const [akunTujuan, setAkunTujuan] = useState('1-1101'); // Default to Kas Tunai
  const [tgl, setTgl] = useState(new Date().toISOString().split('T')[0]);

  const selectedStok = stokData.find(s => s.id === selectedStokId);
  const hargaModal = selectedStok?.hargaModal || 0;
  const totalValue = qty * hargaModal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStok || qty <= 0) return;

    if (qty > selectedStok.qty) {
      alert("Jumlah retur melebihi stok fisik yang ada!");
      return;
    }

    onAddRetur({
      tgl,
      stokId: selectedStokId,
      kodeBarang: selectedStok.kode,
      namaBarang: selectedStok.nama,
      qty,
      hargaModal,
      total: totalValue,
      alasan,
      akunTujuan
    });

    // Reset Form
    setSelectedStokId('');
    setQty(0);
    setAlasan('');
    setView('list');
  };

  const filteredRetur = returData.filter(r => 
    r.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.kodeBarang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <RotateCcw className="h-7 w-7 text-red-600" />
            Retur Pembelian
          </h2>
          <p className="text-slate-500 font-medium text-sm">Kembalikan produk ke supplier & sesuaikan keuangan</p>
        </div>
        
        {view === 'list' ? (
          <button
            onClick={() => setView('form')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Buat Retur Baru
          </button>
        ) : (
          <button
            onClick={() => setView('list')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari item atau kode barang..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Item</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Qty</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Nilai Retur</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tujuan Dana</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRetur.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <ClipboardList className="h-8 w-8 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-medium italic">Belum ada riwayat retur pembelian</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRetur.map((item) => {
                      const targetAccount = coaData.find(c => c.kode === item.akunTujuan);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-bold text-slate-700">{item.tgl}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-black text-slate-900">{item.namaBarang}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.kodeBarang}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-black">
                              -{item.qty} Pcs
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-slate-900">
                              Rp {item.total.toLocaleString('id-ID')}
                            </p>
                          </td>
                          <td className="px-6 py-4 uppercase">
                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">
                              {targetAccount?.nama || item.akunTujuan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => onDeleteRetur(item.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* FORM VIEW */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 space-y-6">
            {/* ITEM SELECTOR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Package className="h-5 w-5 text-red-600" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Pilih Produk & Detail</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pilih Item dari Stok</label>
                  <select
                    required
                    className="appearance-none w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                    value={selectedStokId}
                    onChange={(e) => setSelectedStokId(e.target.value)}
                  >
                    <option value="">-- Pilih Barang --</option>
                    {stokData.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kode}) - Tersedia: {s.qty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tanggal Retur</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                      value={tgl}
                      onChange={(e) => setTgl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kuantitas Retur</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedStok?.qty || 0}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-black text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="0"
                  />
                  {selectedStok && (
                    <p className="text-[10px] text-red-500 font-bold">Max: {selectedStok.qty} Pcs</p>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alasan Retur</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Contoh: Barang cacat/rusak"
                  />
                </div>
              </div>
            </div>

            {/* ACCOUNTING FOCUS */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                <h3 className="font-black text-white uppercase tracking-tight italic">Audit & Jurnal Otomatis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mekanisme Pengembalian</label>
                  <select
                    required
                    className="appearance-none w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={akunTujuan}
                    onChange={(e) => setAkunTujuan(e.target.value)}
                  >
                    <optgroup label="Pengembalian Dana">
                      <option value="1-1101">Kas Tunai</option>
                      {coaData.filter(c => c.kode.startsWith("1-11") && c.kode !== "1-1101").map(c => (
                        <option key={c.kode} value={c.kode}>{c.nama}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Pengurangan Kewajiban">
                      <option value="2-1101">Hutang Usaha</option>
                    </optgroup>
                  </select>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-blue-400 shrink-0" />
                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">
                    Sistem akan otomatis mengkredit <span className="text-white font-black">Persediaan Barang</span> dan mendebet akun yang dipilih di atas senilai modal barang yang diretur.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-1">
                <Banknote className="h-20 w-20 text-slate-50 -mr-4 -mt-4" />
               </div>
               
               <div className="relative space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Ringkasan Nilai</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Harga Modal/Pcs</span>
                      <span>Rp {hargaModal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 border-b border-slate-50 pb-2">
                      <span>Qty Retur</span>
                      <span className="text-red-500">x {qty}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Nilai Jurnal</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        Rp {totalValue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <Save className="h-5 w-5" /> Simpan & Posting Jurnal
                  </button>
               </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
