/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Notebook, Plus, Download, ChevronLeft, ChevronRight, Search, FileDown } from 'lucide-react';
import { JurnalEntry, CoaAccount } from '../types';

interface JurnalProps {
  jurnalData: JurnalEntry[];
  coaData: CoaAccount[];
  accessMode: "admin" | "view";
  onAddJurnal: (tgl: string, no: string, ket: string, entries: { akun: string; debet: number; kredit: number }[]) => void;
  onDeleteJurnal: (no: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (v: string) => void;
}

export function Jurnal(props: JurnalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tgl, setTgl] = useState(new Date().toISOString().split('T')[0]);
  const [no, setNo] = useState("BM-003");
  const [ket, setKet] = useState("");
  const [entries, setEntries] = useState<{ akun: string; debet: number; kredit: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Search filter - with parent-controlled shared support
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = props.searchQuery !== undefined ? props.searchQuery : localSearchQuery;
  const setSearchQuery = props.onSearchQueryChange ? props.onSearchQueryChange : setLocalSearchQuery;

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Automatically reset errorMsg when modal is toggled
  React.useEffect(() => {
    setErrorMsg("");
  }, [isModalOpen]);

  // Handle pagination reset on search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Initialize dropdowns and entries
  React.useEffect(() => {
    if (isModalOpen && props.coaData.length > 0) {
      const def1 = props.coaData[0].kode;
      const def2 = props.coaData.length > 1 ? props.coaData[1].kode : def1;
      setEntries([
        { akun: def1, debet: 0, kredit: 0 },
        { akun: def2, debet: 0, kredit: 0 },
      ]);
    }
  }, [props.coaData, isModalOpen]);

  const handleEntryChange = (idx: number, field: 'akun' | 'debet' | 'kredit', value: any) => {
    const next = [...entries];
    if (field === 'akun') {
      next[idx].akun = value;
    } else if (field === 'debet') {
      next[idx].debet = value;
      if (value > 0) next[idx].kredit = 0;
    } else if (field === 'kredit') {
      next[idx].kredit = value;
      if (value > 0) next[idx].debet = 0;
    }
    setEntries(next);
  };

  const handleRemoveEntry = (idx: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== idx));
    }
  };

  // Handle addition
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!tgl || !no || !ket) {
      setErrorMsg("Mohon lengkapi Tanggal, Nomor Bukti, dan Keterangan!");
      return;
    }

    const activeEntries = entries.filter(ent => ent.debet > 0 || ent.kredit > 0);
    if (activeEntries.length < 2) {
      setErrorMsg("Mohon masukkan minimal 2 baris pencatatan akun dengan nominal lebih dari Rp 0!");
      return;
    }

    const totalDebet = activeEntries.reduce((sum, ent) => sum + ent.debet, 0);
    const totalKredit = activeEntries.reduce((sum, ent) => sum + ent.kredit, 0);

    if (Math.abs(totalDebet - totalKredit) >= 0.01) {
      setErrorMsg(`Debet dan Kredit tidak seimbang (unbalanced)! Selisih: Rp ${Math.abs(totalDebet - totalKredit).toLocaleString('id-ID')}`);
      return;
    }

    props.onAddJurnal(tgl, no, ket, activeEntries);
    
    // Reset form
    setKet("");
    // Auto-generate next voucher no
    const matchNum = no.match(/\d+$/);
    if (matchNum) {
      const nextNum = parseInt(matchNum[0], 10) + 1;
      const paddedNum = String(nextNum).padStart(matchNum[0].length, '0');
      setNo(no.replace(/\d+$/, paddedNum));
    } else {
      setNo("BM-" + Math.floor(Math.random() * 1000));
    }

    setIsModalOpen(false);
  };

  // Export entries directly to Microsoft Excel friendly CSV file format
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "ID,Tanggal,Nomor Bukti,Keterangan,Kode Akun,Debet,Kredit\r\n";
    
    props.jurnalData.forEach(j => {
      const targetAkun = props.coaData.find(c => c.kode === j.akun);
      const accDesc = targetAkun ? `"${targetAkun.kode} - ${targetAkun.nama}"` : `"${j.akun}"`;
      const row = [
        j.id,
        j.tgl,
        j.no,
        `"${j.ket.replace(/"/g, '""')}"`,
        accDesc,
        j.debet.toString(),
        j.kredit.toString()
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jurnal_Koperasi_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe lookup for Account labels
  const getAccountLabel = (kode: string) => {
    const acc = props.coaData.find(c => c.kode === kode);
    return acc ? `${acc.kode} — ${acc.nama}` : kode;
  };

  const filteredJurnal = props.jurnalData.filter(j => {
    const q = searchQuery.toLowerCase();
    const label = getAccountLabel(j.akun).toLowerCase();
    return j.no.toLowerCase().includes(q) || 
           j.ket.toLowerCase().includes(q) || 
           j.tgl.includes(q) ||
           label.includes(q);
  });

  const totalDebet = entries.reduce((sum, e) => sum + e.debet, 0);
  const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
  const isBalance = Math.abs(totalDebet - totalKredit) < 0.01 && totalDebet > 0;
  const deviance = Math.abs(totalDebet - totalKredit);

  const totalPages = Math.ceil(filteredJurnal.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedJurnal = filteredJurnal.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Notebook className="h-6 w-6 text-red-600" /> Jurnal Umum Akuntansi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pencatatan ganda debet dan kredit mutasi kas secara presisi dan terstruktur
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
          <button
            id="export-csv-btn"
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
          {props.accessMode === "admin" && (
            <button
              id="btn-add-jurnal"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Transaksi
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Search bar & statistics info */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              id="search-jurnal"
              type="text"
              placeholder="Cari No. Bukti, Keterangan, atau Akun..."
              className="w-full pl-9 pr-10 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
                title="Bersihkan filter"
              >
                &times;
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total Rekaman Jurnal: <span className="font-bold text-gray-800">{filteredJurnal.length}</span> baris
          </div>
        </div>

        {/* Dynamic Journal Table with grouped borders */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-red-600 text-white text-xs font-semibold">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Bukti</th>
                <th className="py-3 px-4">Keterangan Jurnal</th>
                <th className="py-3 px-4">Akun Rekening Terpilih</th>
                <th className="py-3 px-4 text-right">Debet (Rp)</th>
                <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                {props.accessMode === "admin" && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {paginatedJurnal.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Tidak ditemukan data rekam jurnal yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedJurnal.map((j, idx) => {
                  // Border group styling if same voucher code as previous
                  const isFirstOfVoucher = idx === 0 || paginatedJurnal[idx - 1].no !== j.no;

                  return (
                    <tr 
                      key={j.id} 
                      className={`hover:bg-red-50/20 transition-colors ${isFirstOfVoucher ? 'border-t-2 border-slate-100' : ''}`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-500">
                        {isFirstOfVoucher ? j.tgl : ""}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {isFirstOfVoucher ? j.no : ""}
                      </td>
                      <td className="py-3 px-4 italic text-gray-600 max-w-xs truncate">
                        {isFirstOfVoucher ? j.ket : ""}
                      </td>
                      <td className={`py-3 px-4 ${j.kredit > 0 ? 'pl-8 text-gray-500' : 'font-semibold text-gray-800'}`}>
                        {getAccountLabel(j.akun)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold font-mono">
                        {j.debet > 0 ? j.debet.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-semibold font-mono">
                        {j.kredit > 0 ? j.kredit.toLocaleString('id-ID') : '-'}
                      </td>
                      {props.accessMode === "admin" && (
                        <td className="py-3 px-4 text-center">
                          {isFirstOfVoucher && (
                            <DeleteConfirmButton 
                              onConfirm={() => props.onDeleteJurnal(j.no)}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Baris per halaman:</span>
            <select
              className="px-2 py-1 bg-white border border-gray-200 rounded focus:outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium">
              Halaman <span className="font-bold text-gray-800">{safeCurrentPage}</span> dari <span className="font-bold text-gray-800">{totalPages}</span>
            </span>
            <div className="flex gap-1.5">
              <button
                id="jurnal-prev-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1 px-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                id="jurnal-next-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="p-1 px-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG POPUP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Entri Transaksi Akuntansi Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 text-left space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg leading-relaxed animate-shake">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">Tanggal Catat</label>
                  <input
                    id="form-j-tgl"
                    type="date"
                    required
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                    value={tgl}
                    onChange={(e) => setTgl(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">No. Bukti / Voucher</label>
                  <input
                    id="form-j-no"
                    type="text"
                    required
                    placeholder="Contoh: BM-003"
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-505"
                    value={no}
                    onChange={(e) => setNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">Keterangan Transaksi</label>
                <input
                  id="form-j-ket"
                  type="text"
                  required
                  placeholder="Misal: Penjualan bibit padi secara tunai"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={ket}
                  onChange={(e) => setKet(e.target.value)}
                />
              </div>

              {/* MULTI-ROW JOURNAL ENTRIES */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2 text-[10px] font-black text-gray-500 uppercase tracking-wider px-1">
                  <div className="flex-1">Pilih Rekening Akun</div>
                  <div className="w-24 text-right pr-2">Debet (Rp)</div>
                  <div className="w-24 text-right pr-2">Kredit (Rp)</div>
                  <div className="w-6"></div>
                </div>
                
                <div className="space-y-2.5 max-h-[185px] overflow-y-auto pr-1">
                  {entries.map((joint, entryIdx) => (
                    <div key={entryIdx} className="flex gap-2 items-center">
                      <select
                        value={joint.akun}
                        onChange={(e) => handleEntryChange(entryIdx, 'akun', e.target.value)}
                        className="flex-1 bg-white px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-700 font-medium"
                      >
                        {props.coaData.map(c => (
                          <option key={c.kode} value={c.kode}>{c.kode} — {c.nama}</option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        placeholder="0"
                        value={joint.debet || ""}
                        onChange={(e) => handleEntryChange(entryIdx, 'debet', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded text-right font-black text-emerald-600 focus:outline-none focus:border-emerald-500"
                      />
                      
                      <input
                        type="number"
                        placeholder="0"
                        value={joint.kredit || ""}
                        onChange={(e) => handleEntryChange(entryIdx, 'kredit', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded text-right font-black text-rose-600 focus:outline-none focus:border-red-500"
                      />
                      
                      <div className="w-6 flex items-center justify-center">
                        {entries.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(entryIdx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all text-sm font-bold"
                            title="Hapus baris"
                          >
                            &times;
                          </button>
                        ) : (
                          <span className="w-4"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const defAkun = props.coaData.length > 0 ? props.coaData[0].kode : "";
                    setEntries([...entries, { akun: defAkun, debet: 0, kredit: 0 }]);
                  }}
                  className="w-full py-1.5 border border-dashed border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-705 hover:bg-red-50/20 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="h-3 w-3" /> Tambah Baris Transaksi Baru
                </button>
              </div>

              {/* SYSTEM BALANCING VALUE */}
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500 font-bold uppercase text-[9px]">Total Debet:</span>
                  <span className="text-emerald-600 font-black">Rp {totalDebet.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500 font-bold uppercase text-[9px]">Total Kredit:</span>
                  <span className="text-rose-600 font-black">Rp {totalKredit.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  {totalDebet === 0 && totalKredit === 0 ? (
                    <div className="p-2 py-1.5 bg-gray-100 text-gray-500 rounded text-[10px] font-black text-center uppercase tracking-wider">
                      Isi nominal debet / kredit baris transaksi
                    </div>
                  ) : isBalance ? (
                    <div className="p-2 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black text-center flex items-center justify-center gap-1.5 uppercase tracking-wider">
                      ✓ Balanced (Seimbang) — Rp {totalDebet.toLocaleString('id-ID')}
                    </div>
                  ) : (
                    <div className="p-2 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-black text-center flex flex-col items-center justify-center gap-0.5 uppercase tracking-wider">
                      <span>✗ Belum Seimbang (Unbalanced)</span>
                      <span className="text-[9px] font-semibold text-rose-600 font-mono normal-case tracking-normal">
                        Selisih: Rp {deviance.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs border border-gray-200 hover:bg-gray-50 rounded transition font-medium text-gray-505 text-center"
                >
                  Batalkan
                </button>
                <button
                  id="submit-journal-btn"
                  type="submit"
                  disabled={!isBalance}
                  className={`flex-1 py-1.5 text-white text-xs font-semibold rounded transition text-center focus:outline-none ${
                    isBalance 
                      ? "bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer shadow-md" 
                      : "bg-gray-300 cursor-not-allowed opacity-60"
                  }`}
                  title={isBalance ? "Lakukan penyimpanan entri jurnal" : "Pastikan total Debet dan Kredit harus seimbang"}
                >
                  Rekam Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  const [isPending, setIsPending] = useState(false);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-1.5 min-w-[120px] justify-items-center">
        <button
          type="button"
          onClick={() => {
            onConfirm();
            setIsPending(false);
          }}
          className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2.5 py-1 rounded-md font-bold cursor-pointer transition whitespace-nowrap active:scale-95"
        >
          Ya, Hapus
        </button>
        <button
          type="button"
          onClick={() => setIsPending(false)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold cursor-pointer transition active:scale-95"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPending(true)}
      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded transition text-[10px] font-bold cursor-pointer"
    >
      Hapus
    </button>
  );
}

