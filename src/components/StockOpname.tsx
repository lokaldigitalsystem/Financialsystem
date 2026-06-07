/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  RotateCcw, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  TrendingDown, 
  TrendingUp, 
  User, 
  Calendar, 
  StickyNote,
  HelpCircle,
  Plus,
  Minus,
  Check,
  History,
  Trash2,
  FileDown
} from 'lucide-react';
import { StokItem } from '../types';

interface StockOpnameProps {
  stokData: StokItem[];
  accessMode: "admin" | "view";
  onBulkOpname: (
    adjustments: { stokId: string; newQty: number; diff: number; keterangan: string }[],
    tgl: string,
    petugas: string
  ) => void;
}

interface OpnameSession {
  id: string;
  tanggal: string;
  petugas: string;
  catatan: string;
  totalItems: number;
  selisihCount: number;
  nilaiPenyesuaian: number;
  items: {
    stokId: string;
    kode: string;
    nama: string;
    stokSistem: number;
    stokFisik: number;
    selisih: number;
    keterangan: string;
  }[];
}

export function StockOpname(props: StockOpnameProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "riwayat">("audit");
  
  // Outer form details
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [petugas, setPetugas] = useState("");
  const [catatan, setCatatan] = useState("Opname Bulanan Gudang");
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  
  // Physical counts state: key is stokItem.id, value is quantity
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  // Item-level notes: key is stokItem.id, value is note text
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // History sessions loaded from localStorage
  const [sessions, setSessions] = useState<OpnameSession[]>([]);

  // Confirmation Modal States
  const [showConfirmOpname, setShowConfirmOpname] = useState<{
    msg: string;
    type: "match" | "diff";
    adjustments: any[];
    sessionItems: any[];
  } | null>(null);
  const [showConfirmDeleteSessionId, setShowConfirmDeleteSessionId] = useState<string | null>(null);

  // Initialize physical counts to match system quantities when stokData arrives
  useEffect(() => {
    const counts: Record<string, number> = {};
    const notes: Record<string, string> = {};
    props.stokData.forEach(item => {
      counts[item.id] = item.qty;
      notes[item.id] = "Sesuai fisik";
    });
    setPhysicalCounts(counts);
    setItemNotes(notes);
  }, [props.stokData]);

  // Load history of opname sessions from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('kdmp_opname_sessions');
    if (raw) {
      try {
        setSessions(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse opname sessions:", e);
      }
    }
  }, []);

  const saveSessionsToLocalStorage = (newSessions: OpnameSession[]) => {
    setSessions(newSessions);
    localStorage.setItem('kdmp_opname_sessions', JSON.stringify(newSessions));
  };

  // Helper: Set all physical counts to match system quantities
  const handleAutoFillSystemValues = () => {
    const counts: Record<string, number> = {};
    props.stokData.forEach(item => {
      counts[item.id] = item.qty;
    });
    setPhysicalCounts(counts);
  };

  // Helper: Set all physical counts to 0
  const handleClearAllCounts = () => {
    const counts: Record<string, number> = {};
    props.stokData.forEach(item => {
      counts[item.id] = 0;
    });
    setPhysicalCounts(counts);
  };

  // Safe increment/decrement
  const adjustQty = (id: string, step: number) => {
    setPhysicalCounts(prev => {
      const current = prev[id] !== undefined ? prev[id] : 0;
      return {
        ...prev,
        [id]: Math.max(0, current + step)
      };
    });
  };

  // Change quantity directly from input
  const handleQtyChange = (id: string, val: string) => {
    const num = parseInt(val);
    setPhysicalCounts(prev => ({
      ...prev,
      [id]: isNaN(num) || num < 0 ? 0 : num
    }));
  };

  // Individual item note change
  const handleNoteChange = (id: string, text: string) => {
    setItemNotes(prev => ({
      ...prev,
      [id]: text
    }));
  };

  // Calculate high-level summary metrics
  const filteredStok = props.stokData.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.kode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItemsCounted = props.stokData.length;
  
  let netVarianceQty = 0;
  let netVarianceValue = 0;
  let matchesCount = 0;
  let deficitCount = 0;
  let surplusCount = 0;

  props.stokData.forEach(item => {
    const physical = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.qty;
    const diff = physical - item.qty;
    const modal = item.hargaModal || Math.round(item.hargaJual * 0.75);
    
    netVarianceQty += diff;
    netVarianceValue += diff * modal;

    if (diff === 0) matchesCount++;
    else if (diff < 0) deficitCount++;
    else surplusCount++;
  });

  // Submit and apply opname
  const handleSubmitOpname = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (props.accessMode !== "admin") {
      alert("Hanya Administrator yang memiliki wewenang untuk melakukan Stock Opname!");
      return;
    }

    if (!petugas.trim()) {
      alert("Mohon masukkan nama petugas pemeriksa!");
      return;
    }

    const adjustments: { stokId: string; newQty: number; diff: number; keterangan: string }[] = [];
    const sessionItems: OpnameSession['items'] = [];

    props.stokData.forEach(item => {
      const physical = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.qty;
      const diff = physical - item.qty;
      const note = itemNotes[item.id] || "Sesuai pemeriksaan";

      // Keep record of all audits, even if difference is 0, for the session, 
      // but only pass items with differences to the bulk update processor to save writes/logs
      if (diff !== 0) {
        adjustments.push({
          stokId: item.id,
          newQty: physical,
          diff: diff,
          keterangan: note
        });
      }

      sessionItems.push({
        stokId: item.id,
        kode: item.kode,
        nama: item.nama,
        stokSistem: item.qty,
        stokFisik: physical,
        selisih: diff,
        keterangan: diff === 0 ? "Sesuai Sistem" : note
      });
    });

    if (adjustments.length === 0) {
      setShowConfirmOpname({
        msg: "Semua stok diinput cocok sempurna dengan sistem (tidak ada selisih). Apakah Anda ingin menyimpan dokumen sesi opname ini saja?",
        type: "match",
        adjustments,
        sessionItems
      });
    } else {
      setShowConfirmOpname({
        msg: `Anda akan merubah stok fisik untuk ${adjustments.length} komoditas di gudang secara permanen.\nTotal Selisih Unit: ${netVarianceQty >= 0 ? '+' : ''}${netVarianceQty} Pcs\nNilai Penyesuaian: Rp ${netVarianceValue.toLocaleString('id-ID')}`,
        type: "diff",
        adjustments,
        sessionItems
      });
    }
  };

  const handleApplyOpname = (adjustments: any[], sessionItems: any[]) => {
    // Call state updater in app
    props.onBulkOpname(adjustments, tanggal, petugas);

    // Save session metadata
    const newSession: OpnameSession = {
      id: "opm-" + Date.now() + Math.random().toString(36).substr(2, 4),
      tanggal: tanggal,
      petugas: petugas,
      catatan: catatan,
      totalItems: totalItemsCounted,
      selisihCount: adjustments.length,
      nilaiPenyesuaian: netVarianceValue,
      items: sessionItems
    };

    const nextSessions = [newSession, ...sessions];
    saveSessionsToLocalStorage(nextSessions);

    // Reset notes/counts
    alert("Stock opname gudang berhasil diterapkan! Stok sistem telah dimutakhirkan secara riil.");
    setShowConfirmOpname(null);
    setActiveTab("riwayat");
  };

  const handleDeleteSession = (id: string) => {
    setShowConfirmDeleteSessionId(id);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "audit") {
      csvContent += "Sesi Form Audit Stock Opname Fisik Gudang\r\n";
      csvContent += `Tanggal Audit,${tanggal}\r\n`;
      csvContent += `Petugas Pelaksana,"${petugas.replace(/"/g, '""')}"\r\n`;
      csvContent += `Catatan Penting,"${catatan.replace(/"/g, '""')}"\r\n\r\n`;
      csvContent += "Kode Barang,Nama Barang,Stok Sistem (Sistem),Stok Fisik (Fisik),Selisih (Unit),Keterangan Audit\r\n";
      
      filteredStok.forEach(item => {
        const fisikVal = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.qty;
        const selisihVal = fisikVal - item.qty;
        const noteText = itemNotes[item.id] || "";
        const row = [
          `"${item.kode}"`,
          `"${item.nama.replace(/"/g, '""')}"`,
          item.qty.toString(),
          fisikVal.toString(),
          selisihVal.toString(),
          `"${noteText.replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "Sejarah Log Riwayat Sesi Stock Opname\r\n";
      csvContent += "ID Sesi,Tanggal,Nama Petugas,Catatan Sesi,Jumlah Item,Diskrepansi Item,Total Nilai Penyesuaian\r\n";
      
      sessions.forEach(sess => {
        const row = [
          `"${sess.id}"`,
          `"${sess.tanggal}"`,
          `"${sess.petugas.replace(/"/g, '""')}"`,
          `"${sess.catatan.replace(/"/g, '""')}"`,
          sess.totalItems.toString(),
          sess.selisihCount.toString(),
          sess.nilaiPenyesuaian.toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `STOCK_OPNAME_${activeTab.toUpperCase()}_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* CONFIRMATION MODALS UPGRADED FROM BASIC CONFIRM() */}
      {showConfirmOpname && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${showConfirmOpname.type === 'match' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <FileCheck className={`h-8 w-8 ${showConfirmOpname.type === 'match' ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Finalisasi Stock Opname</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 whitespace-pre-wrap">
                {showConfirmOpname.msg}
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmOpname(null)}
                  className="flex-1 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyOpname(showConfirmOpname.adjustments, showConfirmOpname.sessionItems)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 cursor-pointer"
                >
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteSessionId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Log Opname?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus catatan sejarah sesi opname ini? 
                <br /><small className="text-red-500 font-bold">Catatan: Tindakan ini tidak akan membatalkan perubahan stok yang sudah dilakukan ke sistem.</small>
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteSessionId(null)}
                  className="flex-1 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextSessions = sessions.filter(s => s.id !== showConfirmDeleteSessionId);
                    saveSessionsToLocalStorage(nextSessions);
                    setShowConfirmDeleteSessionId(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 cursor-pointer"
                >
                  Hapus Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6.5 w-6.5 text-red-600" /> Stock Opname Gudang
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Lacak kesesuaian fisik stok, hitung diskrepansi persediaan pupuk/bibit, dan catat berita acara audit logistik desa.
          </p>
        </div>
        <button
          id="export-stockopname-csv-btn"
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer self-start lg:self-auto"
          title="Download stock audit / history as CSV"
        >
          <FileDown className="h-4 w-4" /> Export CSV (Excel)
        </button>
      </div>

      {/* TABS FOR AUDIT FORM & SESSION HISTORY */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab("audit");
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" /> Formulir Audit Fisik
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("riwayat");
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "riwayat"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" /> Sejarah Hasil Audit
        </button>
      </div>

      {activeTab === "audit" ? (
        <>
          {/* GENERAL INFO FIELDS FOR CURRENT OPNAME */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-red-500" /> Informasi Berita Acara Audit
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-450" /> Tanggal Pemeriksaan
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-medium text-gray-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-gray-450" /> Petugas Pemeriksa / Auditor
                </label>
                <input
                  type="text"
                  placeholder="Nama (Jabatan)"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-semibold text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5 text-gray-450" /> Catatan Umum Sesi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Audit stok triwulan kedua"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-medium text-gray-850"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC SUMMARIES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Item Di-Audit</p>
                <h4 className="text-lg font-extrabold text-gray-800">{totalItemsCounted} Variasi</h4>
              </div>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 ${
              netVarianceQty === 0 
                ? 'bg-slate-50/50 border-gray-150 text-slate-700' 
                : netVarianceQty > 0 
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                  : 'bg-amber-50/50 border-amber-100 text-amber-800'
            }`}>
              <div className={`p-2.5 rounded-lg ${
                netVarianceQty === 0 
                  ? 'bg-slate-100 text-slate-600' 
                  : netVarianceQty > 0 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {netVarianceQty >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selisih Kuantitas</p>
                <h4 className="text-lg font-extrabold font-mono">
                  {netVarianceQty > 0 ? `+${netVarianceQty}` : netVarianceQty} Pcs
                </h4>
              </div>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 ${
              netVarianceValue === 0 
                ? 'bg-slate-50/50 border-gray-150 text-slate-700' 
                : netVarianceValue > 0 
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50/50 border-rose-100 text-rose-850'
            }`}>
              <div className={`p-2.5 rounded-lg ${
                netVarianceValue === 0 
                  ? 'bg-slate-100 text-slate-600' 
                  : netVarianceValue > 0 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nilai Selisih Buku</p>
                <h4 className="text-lg font-extrabold font-mono">
                  {netVarianceValue > 0 ? '+' : ''}Rp {netVarianceValue.toLocaleString('id-ID')}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Status Kecocokan Fisik</span>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  {matchesCount} Cocok
                </span>
                {deficitCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-750 border border-rose-200">
                    {deficitCount} Kurang
                  </span>
                )}
                {surplusCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-750 border border-emerald-200">
                    {surplusCount} Lebih
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MAIN FORM TABLE */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            
            {/* TOOLBAR */}
            <div className="p-4 bg-slate-50/80 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari kode atau komoditas barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:bg-white bg-white/70"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>

              {props.accessMode === "admin" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillSystemValues}
                    className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1"
                    title="Setel semua input fisik sama dengan sisa stok tercatat di sistem"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-500" /> Setel Semua Sesuai Sistem
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllCounts}
                    className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1"
                    title="Reset seluruh fisik pencacahan menjadi 0 untuk dihitung ulang"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" /> Reset Semua Kosong
                  </button>
                </div>
              )}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left border-collapse">
                <thead>
                  <tr className="bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[110px]">Kode</th>
                    <th className="py-3.5 px-4">Komoditas / Nama Barang</th>
                    <th className="py-3.5 px-4 text-center w-[120px]">Stok Sistem</th>
                    <th className="py-3.5 px-4 text-center w-[190px]">Stok Fisik Aktual</th>
                    <th className="py-3.5 px-4 text-center w-[110px]">Selisih</th>
                    <th className="py-3.5 px-4 text-right w-[140px]">Nilai Selisih</th>
                    <th className="py-3.5 px-4">Keterangan / Alasan Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredStok.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        Tidak ada komoditas barang yang terdaftar di sistem.
                      </td>
                    </tr>
                  ) : (
                    filteredStok.map(item => {
                      const sysQty = item.qty;
                      const physical = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : sysQty;
                      const diff = physical - sysQty;
                      const modalPrice = item.hargaModal || Math.round(item.hargaJual * 0.75);
                      const diffCostValue = diff * modalPrice;
                      const note = itemNotes[item.id] || "";

                      return (
                        <tr key={item.id} className={`transition-colors duration-150 ${
                          diff === 0 
                            ? "hover:bg-slate-50/50" 
                            : diff > 0 
                              ? "bg-emerald-50/15 hover:bg-emerald-50/30" 
                              : "bg-amber-50/15 hover:bg-amber-100/30"
                        }`}>
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                              {item.kode}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900">{item.nama}</div>
                            <div className="text-[9px] text-gray-400">Modal: Rp {modalPrice.toLocaleString('id-ID')} / Unit</div>
                          </td>

                          {/* System Qty */}
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-gray-700 bg-slate-50/80">
                            {sysQty} Pcs
                          </td>

                          {/* Physical Qty Input */}
                          <td className="py-3.5 px-4 text-center">
                            {props.accessMode === "admin" ? (
                              <div className="inline-flex items-center justify-center p-1 bg-white border border-gray-200 rounded-lg shadow-2xs gap-1">
                                <button
                                  type="button"
                                  onClick={() => adjustQty(item.id, -1)}
                                  className="w-6 h-6 hover:bg-slate-100 flex items-center justify-center rounded-md border border-slate-150 text-slate-500 cursor-pointer active:scale-95 transition"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={physical}
                                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                  className="w-16 py-0.5 text-center text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500 rounded bg-slate-50/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustQty(item.id, 1)}
                                  className="w-6 h-6 hover:bg-slate-100 flex items-center justify-center rounded-md border border-slate-150 text-slate-500 cursor-pointer active:scale-95 transition"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-gray-800">{physical} Pcs</span>
                            )}
                          </td>

                          {/* Variance Qty */}
                          <td className="py-3.5 px-4 text-center font-bold">
                            {diff === 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                                <Check className="h-3 w-3 text-gray-400" /> Sesuai
                              </span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                +{diff} Lebih
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                {diff} Kurang
                              </span>
                            )}
                          </td>

                          {/* Variance Value */}
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                            diffCostValue === 0 
                              ? 'text-gray-400' 
                              : diffCostValue > 0 
                                ? 'text-emerald-600' 
                                : 'text-rose-600'
                          }`}>
                            {diffCostValue > 0 ? '+' : ''}{diffCostValue === 0 ? 'Rp 0' : `Rp ${diffCostValue.toLocaleString('id-ID')}`}
                          </td>

                          {/* Adjustment Note */}
                          <td className="py-3.5 px-4">
                            {props.accessMode === "admin" ? (
                              <div className="flex gap-1.5 items-center w-full">
                                <select 
                                  value={note}
                                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-150 rounded-lg focus:outline-none focus:border-red-500 text-gray-700 bg-white font-medium"
                                >
                                  <option value="">-- Pilih Alasan --</option>
                                  <option value="Terjual (Auto-Sale)">Terjual (Auto-Sale)</option>
                                  <option value="Sesuai fisik">Cocok Fisik</option>
                                  <option value="Barang Cacat / Rusak">Cacat/Rusak</option>
                                  <option value="Penyusutan Alami">Suhu/Susut</option>
                                  <option value="Kesalahan Catat Admin">Salah Input</option>
                                  <option value="Hilang / Selisih Gudang">Hilang</option>
                                  <option value="Retur Barang">Retur Barang</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">{note || "Sesuai pemeriksaan"}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* SUBMIT BUTTON FOOTER */}
            {props.accessMode === "admin" && props.stokData.length > 0 && (
              <div className="p-5 border-t border-gray-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2 max-w-lg">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Dengan menekan tombol simpan, sistem secara otomatis akan merubah jumlah stok fisik yang tertera di modul Inventaris Toko dan mendokumentasikannya di sejarah logistik pertambahan & pengurangan barang.
                  </p>
                </div>
                
                <button
                  id="btn-save-stock-opname"
                  type="button"
                  onClick={handleSubmitOpname}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition transform active:scale-95 duration-100 inline-flex items-center gap-1.5 self-end sm:self-auto"
                >
                  <FileCheck className="h-4.5 w-4.5" /> Terapkan &amp; Simpan Berita Acara Opname
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* TAB 2: HISTORY OF COMPLETED SESSIONS */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-5">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-2">
              <History className="h-4.5 w-4.5 text-slate-600" /> Log Sesi Stock Opname
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Daftar sesi pemeriksaan fisik inventaris gudang yang telah berhasil dilakukan dan diselesaikan oleh staff koperasi desa.
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-150 p-12 text-center text-gray-400">
              <ClipboardCheck className="h-10 w-10 text-gray-250 mx-auto mb-3" />
              <p className="text-xs font-semibold">Belum terdapat rekaman Stock Opname yang tersimpan sebelumnya.</p>
              <p className="text-[10px] text-gray-400 mt-1">Gunakan formulir audit di tab sebelah untuk melakukan Stock Opname baru.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session, index) => {
                const adjList = session.items.filter(it => it.selisih !== 0);
                return (
                  <div key={session.id} className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-700 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                            Sesi #{sessions.length - index}
                          </span>
                          <span className="font-mono text-xs text-slate-300">ID: {session.id}</span>
                        </div>
                        <h4 className="text-xs mt-1.5 font-bold text-slate-200">
                          Catatan: <span className="text-white font-extrabold">{session.catatan || "Audit Bulanan"}</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="text-right text-xs">
                          <p className="text-slate-300">Dikerjakan pada tanggal</p>
                          <p className="font-bold text-white tracking-wide">{session.tanggal}</p>
                        </div>
                        {props.accessMode === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1 px-2 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-500/10 text-rose-300 hover:text-white transition duration-150 cursor-pointer"
                            title="Hapus rekaman sejarah dokumen ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50 p-4 font-mono text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auditor</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{session.petugas}</p>
                      </div>
                      <div className="sm:pl-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diperiksa</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{session.totalItems} Items</p>
                      </div>
                      <div className="sm:pl-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Penyesuaian Fisik</p>
                        <p className={`font-semibold mt-0.5 ${session.selisihCount === 0 ? "text-gray-500" : "text-amber-600 font-extrabold"}`}>
                          {session.selisihCount} Item Mengalami Selisih
                        </p>
                      </div>
                      <div className="sm:pl-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dampak Finansial Bersih</p>
                        <p className={`font-bold mt-0.5 ${
                          session.nilaiPenyesuaian === 0 
                            ? "text-gray-500" 
                            : session.nilaiPenyesuaian > 0 
                              ? "text-emerald-600" 
                              : "text-rose-600"
                        }`}>
                          {session.nilaiPenyesuaian > 0 ? '+' : ''}Rp {session.nilaiPenyesuaian.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Table of adjustments inside this session */}
                    <div className="p-4">
                      {adjList.length === 0 ? (
                        <div className="text-center py-4 bg-emerald-50/20 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-semibold">
                          🌿 Luar Biasa! Sesi ini tidak menemukan diskrepansi persediaan apa pun. Seluruh stok fisik 100% cocok dengan catatan pembukuan sistem.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Rincian Selisih Barang:
                          </p>
                          <div className="overflow-x-auto border border-gray-100 rounded-lg">
                            <table className="w-full text-left font-sans text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase border-b border-gray-100">
                                  <th className="py-2 px-3">Barang</th>
                                  <th className="py-2 px-3 text-center">Tercatat Sistem</th>
                                  <th className="py-2 px-3 text-center">Fisik Rill</th>
                                  <th className="py-2 px-3 text-center">Selisih</th>
                                  <th className="py-2 px-3">Sebab Diskrepansi / Keterangan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {adjList.map(item => (
                                  <tr key={item.stokId} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3">
                                      <span className="font-mono font-bold text-[10px] bg-slate-100 px-1 py-0.2 rounded mr-1.5 text-slate-700">
                                        {item.kode}
                                      </span> 
                                      <span className="font-semibold text-gray-800">{item.nama}</span>
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono text-gray-500">
                                      {item.stokSistem} Pcs
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono font-bold text-gray-800">
                                      {item.stokFisik} Pcs
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono font-extrabold">
                                      {item.selisih > 0 ? (
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                                          +{item.selisih} Pcs
                                        </span>
                                      ) : (
                                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                                          {item.selisih} Pcs
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-gray-500 italic text-[11px]">
                                      {item.keterangan || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
