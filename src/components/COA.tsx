/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ListTodo, Plus, Search, Tag, ArrowUpDown, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CoaAccount, CoaKategori, SaldoNormal } from '../types';

interface CoaProps {
  coaData: CoaAccount[];
  accessMode: "admin" | "view";
  onAddCoa: (kode: string, nama: string, kategori: CoaKategori, normal: SaldoNormal, saldo: number) => void;
  onUpdateCoaSaldoAwal?: (kode: string, newSaldoAwal: number) => void;
  keywordQuery?: string;
  onKeywordQueryChange?: (v: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (v: string) => void;
  onNavigateToJurnal?: (code: string) => void;
}

type SortField = 'kode' | 'nama' | 'kategori' | 'normal' | 'saldo';

export function COA(props: CoaProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKode, setNewKode] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKategori, setNewKategori] = useState<CoaKategori>(CoaKategori.Aset);
  const [newNormal, setNewNormal] = useState<SaldoNormal>(SaldoNormal.Debet);
  const [newSaldo, setNewSaldo] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [adjustingAccount, setAdjustingAccount] = useState<CoaAccount | null>(null);
  const [newSaldoAwalVal, setNewSaldoAwalVal] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Clear modal error when opening
  React.useEffect(() => {
    setErrorMsg("");
  }, [isModalOpen]);

  // Fallback local filters if state not provided by parent
  const [localKeyword, setLocalKeyword] = useState("");
  const [localKategoriFilter, setLocalKategoriFilter] = useState<string>("");

  const keyword = props.keywordQuery !== undefined ? props.keywordQuery : localKeyword;
  const setKeyword = props.onKeywordQueryChange ? props.onKeywordQueryChange : setLocalKeyword;

  const kategoriFilter = props.categoryFilter !== undefined ? props.categoryFilter : localKategoriFilter;
  const setKategoriFilter = props.onCategoryFilterChange ? props.onCategoryFilterChange : setLocalKategoriFilter;

  // Reset page when search pattern or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [keyword, kategoriFilter]);

  const [sortField, setSortField] = useState<SortField>('kode');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newKode || !newNama) {
      setErrorMsg("Mohon masukkan Kode Rekening dan Nama Klasifikasi!");
      return;
    }
    // Check duplication
    const exists = props.coaData.find(c => c.kode === newKode);
    if (exists) {
      setErrorMsg("Kode Akun ini sudah terdaftar sebelumnya!");
      return;
    }

    props.onAddCoa(newKode, newNama, newKategori, newNormal, newSaldo);

    // Reset Form
    setNewKode("");
    setNewNama("");
    setNewKategori(CoaKategori.Aset);
    setNewNormal(SaldoNormal.Debet);
    setNewSaldo(0);
    setIsModalOpen(false);
  };

  // Export COA elements directly to CSV
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Kode Akun,Nama Akun,Kelompok Kategori,Saldo Normal,Saldo Awal (Rp),Saldo Akhir (Rp)\r\n";
    
    filteredAndSortedCOA.forEach(c => {
      const sa = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
      const row = [
        `"${c.kode}"`,
        `"${c.nama.replace(/"/g, '""')}"`,
        `"${c.kategori}"`,
        `"${c.normal}"`,
        sa.toString(),
        c.saldo.toString()
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `COA_Financial_System_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort and Filter logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSortedCOA = props.coaData
    .filter(c => {
      const matchKeyword = c.kode.toLowerCase().includes(keyword.toLowerCase()) || 
                           c.nama.toLowerCase().includes(keyword.toLowerCase());
      const matchKategori = !kategoriFilter || c.kategori === kategoriFilter;
      return matchKeyword && matchKategori;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      } else {
        return sortAsc
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });

  const totalRows = filteredAndSortedCOA.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const adjustedCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (adjustedCurrentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCOA = filteredAndSortedCOA.slice(startIndex, endIndex);

  // Get modern beautiful color for category badges
  const getBadgeClass = (kategori: CoaKategori) => {
    switch (kategori) {
      case CoaKategori.Aset:
        return "bg-sky-50 text-sky-700 border-sky-100";
      case CoaKategori.Kewajiban:
        return "bg-amber-50 text-amber-700 border-amber-100";
      case CoaKategori.Ekuitas:
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case CoaKategori.Pendapatan:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case CoaKategori.Beban:
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-red-600" /> Chart of Accounts (COA)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Daftar klasifikasi akun neraca saldo &amp; rugi laba sistem keuangan terpadu.
          </p>
        </div>
        {props.accessMode === "admin" && (
          <div className="mt-4 md:mt-0">
            <button
              id="btn-add-coa"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Registrasi Akun Baru
            </button>
          </div>
        )}
      </div>

      {/* FILTER & INPUT SEARCH CONTROL */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">Pencarian Kata Kunci</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="search-coa"
                type="text"
                placeholder="Ketik kode atau nama rekening..."
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-red-500"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">Grup Kategori Akun</label>
            <select
              id="filter-coa-category"
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-red-500"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
            >
              <option value="">-- Tampilkan Seluruh Kategori --</option>
              {Object.values(CoaKategori).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-between sm:col-span-2 md:col-span-1 text-xs text-gray-500 font-medium py-1">
            <span className="self-end pb-1.5">
              Menampilkan <span className="font-bold text-red-600 px-1">{filteredAndSortedCOA.length}</span> Akun Aktif
            </span>
            <button
              id="export-coa-csv-btn"
              onClick={exportToCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded transition flex items-center gap-1 cursor-pointer shadow-sm hover:shadow active:scale-95"
              title="Ekspor seluruh daftar COA ke Microsoft Excel / berkas CSV"
            >
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* COA GRID TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <thead>
              <tr className="bg-red-600 text-white text-xs font-semibold">
                <th onClick={() => handleSort('kode')} className="py-3 px-4 cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">Kode Akun <ArrowUpDown className="h-3.5 w-3.5" /></div>
                </th>
                <th onClick={() => handleSort('nama')} className="py-3 px-4 cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">Nama Rekening Buku <ArrowUpDown className="h-3.5 w-3.5" /></div>
                </th>
                <th onClick={() => handleSort('kategori')} className="py-3 px-4 cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">Kelompok Kategori <ArrowUpDown className="h-3.5 w-3.5" /></div>
                </th>
                <th onClick={() => handleSort('normal')} className="py-3 px-4 cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">Saldo Normal <ArrowUpDown className="h-3.5 w-3.5" /></div>
                </th>
                <th onClick={() => handleSort('saldo')} className="py-3 px-4 cursor-pointer select-none text-right">
                  <div className="flex items-center justify-end gap-1.5">Saldo Aktual (Rp) <ArrowUpDown className="h-3.5 w-3.5" /></div>
                </th>
                <th className="py-3 px-4 text-center">Buku Besar Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {paginatedCOA.map(c => (
                <tr key={c.kode} className="hover:bg-red-50/10 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-800 tracking-wider">
                    {c.kode}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {c.nama}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${getBadgeClass(c.kategori)}`}>
                      {c.kategori}
                    </span>
                  </td>
                  <td className="py-3 px-4 italic text-gray-600">
                    {c.normal}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-gray-900">Rp {c.saldo.toLocaleString('id-ID')}</span>
                      {c.saldoAwal !== undefined && (
                        <span className="text-[9px] text-gray-400 font-medium tracking-tight">Awal: Rp {c.saldoAwal.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {props.onNavigateToJurnal && (
                        <button
                          onClick={() => props.onNavigateToJurnal!(c.kode)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-200 border border-red-200/55 rounded-full text-red-600 font-bold text-[10.5px] cursor-pointer hover:shadow-xs transition"
                          title={`Buka Buku Besar / Lihat Transaksi Jurnal untuk Akun ${c.nama}`}
                        >
                          Buku Besar &rarr;
                        </button>
                      )}
                      {props.accessMode === "admin" && props.onUpdateCoaSaldoAwal && (
                        <button
                          id={`adjust-btn-${c.kode}`}
                          onClick={() => {
                            setAdjustingAccount(c);
                            setNewSaldoAwalVal(c.saldoAwal !== undefined ? c.saldoAwal : c.saldo);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-200 border border-amber-200 rounded-full text-amber-700 font-bold text-[10.5px] cursor-pointer"
                          title={`Sesuaikan Saldo Awal Akun ${c.nama}`}
                        >
                          Sesuaikan Saldo Awal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-500">Baris Halaman:</span>
            <select
              id="rows-per-page-select"
              className="bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-red-500 text-xs font-semibold cursor-pointer text-gray-700 font-mono"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-gray-500 font-medium select-none">
              Menampilkan <span className="font-bold text-gray-700">{totalRows > 0 ? startIndex + 1 : 0}</span> s/d <span className="font-bold text-gray-700">{Math.min(endIndex, totalRows)}</span> dari <span className="font-bold text-red-650">{totalRows}</span> Akun
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-prev-page"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={adjustedCurrentPage === 1}
              className="px-3 py-1 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:text-gray-300 disabled:cursor-not-allowed transition font-semibold cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            
            <div className="flex items-center gap-1 font-medium text-gray-500 select-none">
              Halaman <span className="font-bold text-gray-900 px-1.5 py-0.5 bg-gray-100/80 rounded font-mono border border-gray-150">{adjustedCurrentPage}</span> dari <span className="font-bold text-gray-900 px-1.5 py-0.5 bg-gray-100/80 rounded font-mono border border-gray-150">{totalPages}</span>
            </div>

            <button
              id="btn-next-page"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={adjustedCurrentPage === totalPages}
              className="px-3 py-1 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:text-gray-300 disabled:cursor-not-allowed transition font-semibold cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DIALOG ADD COA POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Registrasi Akun COA Baru</h3>
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
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kode Akun</label>
                <input
                  id="form-coa-kode"
                  type="text"
                  required
                  placeholder="Misal: 1-1104"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-mono"
                  value={newKode}
                  onChange={(e) => setNewKode(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nama Rekening / Akun</label>
                <input
                  id="form-coa-nama"
                  type="text"
                  required
                  placeholder="Misal: Bank Mandiri System"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kategori</label>
                  <select
                    className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none"
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value as CoaKategori)}
                  >
                    {Object.values(CoaKategori).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saldo Normal</label>
                  <select
                    className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none"
                    value={newNormal}
                    onChange={(e) => setNewNormal(e.target.value as SaldoNormal)}
                  >
                    {Object.values(SaldoNormal).map(norm => (
                      <option key={norm} value={norm}>{norm}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-1.5 text-xs border border-gray-200 hover:bg-gray-50 rounded transition font-medium text-gray-500 text-center"
                >
                  Batal
                </button>
                <button
                  id="submit-coa-btn"
                  type="submit"
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition text-center"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG EDIT SALDO AWAL */}
      {adjustingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-amber-600 px-5 py-4 text-white flex justify-between items-center bg-amber-600">
              <div>
                <h3 className="font-bold text-sm">Sesuaikan Saldo Awal Akun COA</h3>
                <p className="text-[10px] text-amber-100/90 font-medium">Ubah nominal di awal pembukuan sebelum mutasi jurnal</p>
              </div>
              <button 
                onClick={() => setAdjustingAccount(null)}
                className="text-white hover:text-white/80 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (props.onUpdateCoaSaldoAwal) {
                props.onUpdateCoaSaldoAwal(adjustingAccount.kode, newSaldoAwalVal);
              }
              setAdjustingAccount(null);
            }} className="p-5 space-y-4">
              <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-[9px] font-bold text-gray-400 font-mono">DETAIL AKUN</span>
                <span className="text-[11px] font-bold text-gray-800 tracking-tight font-mono">{adjustingAccount.kode} — {adjustingAccount.nama}</span>
                <span className="text-[9px] text-gray-400 font-medium italic">Kategori: {adjustingAccount.kategori} ({adjustingAccount.normal})</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saldo Awal Baru (IDR)</label>
                <input
                  id="form-adjust-saldo-awal"
                  type="number"
                  required
                  placeholder="Misal: 15000000"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-amber-500 font-mono font-bold"
                  value={newSaldoAwalVal}
                  onChange={(e) => setNewSaldoAwalVal(parseFloat(e.target.value) || 0)}
                />
                <p className="text-[10px] text-gray-400 leading-relaxed font-normal">
                  Sistem otomatis menyesuaikan Saldo Akhir saat ini berdasarkan formula: <span className="font-semibold text-slate-600">Saldo Awal Baru + Jumlah Transaksi Jurnal</span>.
                </p>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingAccount(null)}
                  className="flex-1 py-1.5 text-xs border border-gray-200 hover:bg-gray-50 rounded transition font-medium text-gray-500 text-center"
                >
                  Batal
                </button>
                <button
                  id="save-adjust-btn"
                  type="submit"
                  className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition text-center cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
