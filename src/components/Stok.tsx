/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Edit, 
  AlertTriangle, 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  RefreshCcw, 
  ArrowUpRight, 
  Calendar, 
  Coins, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  Info,
  FileDown
} from 'lucide-react';
import { StokItem, StokHistoriEntry } from '../types';

interface StokProps {
  stokData: StokItem[];
  stokHistoriData: StokHistoriEntry[];
  accessMode: "admin" | "view";
  onUpdateStok: (id: string, newQty: number) => void;
  onRestockStok: (id: string, qtyAdded: number, customHargaModal: number, tgl: string, keterangan: string) => void;
  onAddStok: (kode: string, nama: string, hargaJual: number, hargaModal: number, initialQty: number) => void;
  onDeleteStok: (id: string) => void;
  onDeleteStokHistori: (id: string) => void;
}

export function Stok(props: StokProps) {
  // Navigation / Sub-menu tab state
  const [activeTab, setActiveTab] = useState<"daftar" | "riwayat">("daftar");

  // Modal states
  const [isAddProductModelOpen, setIsAddProductModelOpen] = useState(false);
  const [selectedManageItem, setSelectedManageItem] = useState<StokItem | null>(null);
  const [manageTab, setManageTab] = useState<"restock" | "adjust">("restock");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced filter states for History/Riwayat Log
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Helper function to dynamically identify category of stock item based on name
  const getBarangKategori = (nama: string): string => {
    const lowercase = nama.toLowerCase();
    if (lowercase.includes("pupuk")) return "Pupuk";
    if (lowercase.includes("bibit") || lowercase.includes("benih") || lowercase.includes("padi") || lowercase.includes("jagung")) return "Bibit / Benih";
    if (lowercase.includes("pestisida") || lowercase.includes("obat") || lowercase.includes("hama") || lowercase.includes("cair")) return "Pestisida & Obat Pertanian";
    return "Lain-lain";
  };

  // Pagination states
  const [currentPageDaftar, setCurrentPageDaftar] = useState(1);
  const [currentPageRiwayat, setCurrentPageRiwayat] = useState(1);
  const itemsPerPageDaftar = 10;
  const itemsPerPageRiwayat = 10;

  // Reset pagination on search, advanced filters, or tab change
  useEffect(() => {
    setCurrentPageDaftar(1);
    setCurrentPageRiwayat(1);
  }, [searchQuery, filterKategori, filterStartDate, filterEndDate, activeTab]);

  // Deletion confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);

  // New product form states
  const [newKode, setNewKode] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newHargaModal, setNewHargaModal] = useState<number>(0);
  const [newHargaJual, setNewHargaJual] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(0);
  const [errorAdd, setErrorAdd] = useState("");

  // Manage stock form states
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockHargaModal, setRestockHargaModal] = useState<number>(0);
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
  const [restockKet, setRestockKet] = useState("Restok barang gudang");
  
  const [adjustQty, setAdjustQty] = useState<number>(0);

  // Open "restock/adjust" modal helper
  const handleOpenManageModal = (item: StokItem) => {
    setSelectedManageItem(item);
    setManageTab("restock");
    setRestockQty(10);
    setRestockHargaModal(item.hargaModal || Math.round(item.hargaJual * 0.75));
    setRestockDate(new Date().toISOString().split('T')[0]);
    setRestockKet(`Restok tambahan ${item.nama}`);
    setAdjustQty(item.qty);
  };

  // Submit new product
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAdd("");

    if (!newKode || !newNama || newHargaJual <= 0 || newHargaModal < 0 || newQty < 0) {
      setErrorAdd("Mohon lengkapi semua isian formulir dengan nominal valid!");
      return;
    }

    if (newHargaJual < newHargaModal) {
      setErrorAdd("Peringatan: Harga jual lebih kecil daripada harga modal!");
      return;
    }

    // Check of duplicate code
    const isDuplicate = props.stokData.some(s => s.kode.toLowerCase() === newKode.toLowerCase());
    if (isDuplicate) {
      setErrorAdd("Kode barang ini sudah terdaftar sebelumnya!");
      return;
    }

    props.onAddStok(newKode, newNama, newHargaJual, newHargaModal, newQty);
    
    // Reset
    setNewKode("");
    setNewNama("");
    setNewHargaModal(0);
    setNewHargaJual(0);
    setNewQty(0);
    setIsAddProductModelOpen(false);
  };

  // Submit restock or adjustment
  const handleManageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManageItem) return;

    if (manageTab === "restock") {
      if (restockQty <= 0) {
        alert("Jumlah penambahan harus lebih besar dari 1!");
        return;
      }
      props.onRestockStok(selectedManageItem.id, restockQty, restockHargaModal, restockDate, restockKet);
    } else {
      props.onUpdateStok(selectedManageItem.id, adjustQty);
    }

    setSelectedManageItem(null);
  };

  // Filtered stok data
  const filteredStok = props.stokData.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.kode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination for Daftar Table
  const totalItemsDaftar = filteredStok.length;
  const totalPagesDaftar = Math.ceil(totalItemsDaftar / itemsPerPageDaftar) || 1;
  const activePageDaftar = Math.min(currentPageDaftar, totalPagesDaftar);
  const startIndexDaftar = (activePageDaftar - 1) * itemsPerPageDaftar;
  const endIndexDaftar = Math.min(startIndexDaftar + itemsPerPageDaftar, totalItemsDaftar);
  const paginatedStok = filteredStok.slice(startIndexDaftar, endIndexDaftar);

  // Filtered histori logs with advanced audit filters
  const filteredHistori = props.stokHistoriData.filter(log => {
    // 1. Keyword search filter
    const matchesKeyword = 
      log.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.keterangan || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesKeyword) return false;

    // 2. Category filter
    if (filterKategori !== "Semua") {
      const cat = getBarangKategori(log.namaBarang);
      if (cat !== filterKategori) return false;
    }

    // 3. Date range filter (start and end range inclusive)
    if (filterStartDate && log.tgl < filterStartDate) {
      return false;
    }
    if (filterEndDate && log.tgl > filterEndDate) {
      return false;
    }

    return true;
  });

  // Pagination for Riwayat Table
  const totalItemsRiwayat = filteredHistori.length;
  const totalPagesRiwayat = Math.ceil(totalItemsRiwayat / itemsPerPageRiwayat) || 1;
  const activePageRiwayat = Math.min(currentPageRiwayat, totalPagesRiwayat);
  const startIndexRiwayat = (activePageRiwayat - 1) * itemsPerPageRiwayat;
  const endIndexRiwayat = Math.min(startIndexRiwayat + itemsPerPageRiwayat, totalItemsRiwayat);
  const paginatedHistori = filteredHistori.slice(startIndexRiwayat, endIndexRiwayat);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "daftar") {
      csvContent += "Katalog Barang & Inventaris Toko Koperasi\r\n";
      csvContent += "Kode Barang,Nama Barang,Harga Beli/Modal (Rp),Harga Jual (Rp),Stok Fisik Saat Ini (Unit),Nilai Persediaan (Rp),Status Persediaan\r\n";
      
      filteredStok.forEach(s => {
        const valPersediaan = s.qty * (s.hargaModal || 0);
        const statusText = s.qty <= 0 ? "Habis" : s.qty <= 10 ? "Menipis" : "Tersedia";
        const row = [
          `"${s.kode}"`,
          `"${s.nama.replace(/"/g, '""')}"`,
          (s.hargaModal || 0).toString(),
          s.hargaJual.toString(),
          s.qty.toString(),
          valPersediaan.toString(),
          `"${statusText}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "Riwayat Log Transaksi & Mutasi Persediaan\r\n";
      csvContent += "ID Log,Tanggal,Kode Barang,Nama Komoditas,Jenis Perubahan,Mutasi Qty,Keterangan Audit\r\n";
      
      filteredHistori.forEach(log => {
        const row = [
          `"${log.id}"`,
          `"${log.tgl}"`,
          `"${log.kodeBarang}"`,
          `"${log.namaBarang.replace(/"/g, '""')}"`,
          `"${log.qtyAdded > 0 ? 'Kembali / Masuk' : 'Pengurangan / Keluar'}"`,
          log.qtyAdded.toString(),
          `"${(log.keterangan || '').replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `STOK_${activeTab.toUpperCase()}_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Boxes className="h-6.5 w-6.5 text-red-600" /> Stok &amp; Logistik Gudang
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Urus persediaan komoditas pupuk, obat pertanian, dan bibit tanaman unggul desa secara transparan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Action buttons moved to table control bars below for better grouping */}
        </div>
      </div>

      {/* SUBMENU NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 max-w-lg">
        <button
          type="button"
          onClick={() => {
            setActiveTab("daftar");
            setConfirmDeleteLogId(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "daftar"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="h-4 w-4" /> Daftar Inventaris Toko &amp; Gudang
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("riwayat");
            setConfirmDeleteId(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "riwayat"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <RefreshCcw className="h-4 w-4" /> Log Riwayat Penambahan Stok
        </button>
      </div>

      {activeTab === "daftar" ? (
        <>
          {/* QUICK ANALYTICS METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Variasi Barang</p>
                <h4 className="text-xl font-extrabold text-gray-800">{props.stokData.length} Jenis</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Unit Stok Aktif</p>
                <h4 className="text-xl font-extrabold text-gray-800">
                  {props.stokData.reduce((acc, curr) => acc + curr.qty, 0).toLocaleString('id-ID')} Pcs
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimasi Total Profit Stok</p>
                <h4 className="text-xl font-extrabold text-gray-800">
                  Rp {props.stokData.reduce((acc, s) => {
                    const modal = s.hargaModal || Math.round(s.hargaJual * 0.75);
                    const untung = s.hargaJual - modal;
                    return acc + (untung * s.qty);
                  }, 0).toLocaleString('id-ID')}
                </h4>
              </div>
            </div>
          </div>

          {/* MAIN PRODUCTS TABLE CARD */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-gray-800 uppercase tracking-widest block">Daftar Logistik Gudang</span>
                <span className="text-[10px] text-gray-400 font-medium">Satuan transaksi dinilai dalam Rupiah (IDR)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                <div className="w-full sm:w-64 relative">
                  <input 
                    id="search-stok-gudang"
                    type="text"
                    placeholder="Cari kode atau nama barang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
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

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id="export-stok-csv-btn-table"
                    onClick={exportToCSV}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Download stock/ledger as CSV"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Export CSV
                  </button>

                  {props.accessMode === "admin" && (
                    <button
                      id="btn-tambah-barang-table"
                      onClick={() => setIsAddProductModelOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Registrasi Barang Baru
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-red-600 text-white text-[11px] font-semibold tracking-wider">
                    <th className="py-3 px-4 w-[110px]">Kode</th>
                    <th className="py-3 px-4">Nama Komoditas / Barang</th>
                    <th className="py-3 px-4 text-right">Harga Modal</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-right text-yellow-100">Keuntungan (U.P)</th>
                    <th className="py-3 px-4 text-center">Stok</th>
                    <th className="py-3 px-4 text-center">Keamanan</th>
                    {props.accessMode === "admin" && <th className="py-3 px-4 text-center w-[180px]">Tindakan</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {paginatedStok.length === 0 ? (
                    <tr>
                      <td colSpan={props.accessMode === "admin" ? 8 : 7} className="py-8 text-center text-gray-400 font-medium">
                        Tidak ada barang logistik yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    paginatedStok.map(item => {
                      const isLow = item.qty <= 15;
                      const isOutOfStock = item.qty === 0;

                      // Compute profit metrics
                      const modalPrice = item.hargaModal || Math.round(item.hargaJual * 0.75);
                      const unitProfit = item.hargaJual - modalPrice;
                      const totalProfit = unitProfit * item.qty;
                      const profitPct = modalPrice > 0 ? Math.round((unitProfit / modalPrice) * 100) : 0;

                      return (
                        <tr key={item.id} className="hover:bg-red-50/10 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-800">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                              {item.kode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{item.nama}</div>
                            <div className="text-[9px] text-gray-400">ID Ref: {item.id}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-medium font-mono">
                            Rp {modalPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 font-mono">
                            Rp {item.hargaJual.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                            <div className="flex flex-col items-end">
                              <span>+Rp {unitProfit.toLocaleString('id-ID')}</span>
                              <span className="text-[9px] font-medium text-gray-400">
                                Margin {profitPct}% ({totalProfit > 0 ? `Rp ${totalProfit.toLocaleString('id-ID')} tot` : 'Rp 0'})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-gray-800">
                            {item.qty} Unit
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded bg-rose-100 text-rose-700 border border-rose-200">
                                Stok Habis
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                Kritis
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Aman
                              </span>
                            )}
                          </td>
                          
                          {props.accessMode === "admin" && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {confirmDeleteId === item.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-200">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        props.onDeleteStok(item.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] px-2 py-0.5 rounded font-extrabold cursor-pointer transition active:scale-95"
                                    >
                                      Ya, Hapus
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenManageModal(item)}
                                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition font-bold cursor-pointer"
                                      title="Tambah qty stok atau sesuaikan fisik"
                                    >
                                      <PlusCircle className="h-3.5 w-3.5 text-red-500" /> Restok / Sesuaikan
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(item.id)}
                                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Hapus barang logistik"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Daftar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500 font-medium">
                Menampilkan <span className="font-bold text-gray-800">{totalItemsDaftar > 0 ? startIndexDaftar + 1 : 0}</span> s/d{" "}
                <span className="font-bold text-gray-800">{endIndexDaftar}</span> dari{" "}
                <span className="font-bold text-gray-800">{totalItemsDaftar}</span> barang logistik
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activePageDaftar === 1}
                  onClick={() => setCurrentPageDaftar(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition text-gray-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer active:scale-95"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-gray-700 font-mono bg-white border border-gray-150 rounded-lg">
                  Halaman {activePageDaftar} / {totalPagesDaftar}
                </span>
                <button
                  type="button"
                  disabled={activePageDaftar === totalPagesDaftar}
                  onClick={() => setCurrentPageDaftar(prev => Math.min(totalPagesDaftar, prev + 1))}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition text-gray-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer active:scale-95"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* TAB RIWAYAT: STOCK ADDITIONS HISTORY TABLE WITH INDIVIDUAL DELETE */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-gray-50 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-amber-600" /> Log Riwayat Penambahan Stok (Gudang Logistik)
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Riwayat logistik pertambahan dan penyesuaian persediaan barang toko secara riil fisik untuk pencatatan audit. Anda dapat menghapus log riwayat bila terdapat kesalahan.
              </p>
            </div>
            
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer self-start md:self-auto"
              title="Download history logs as CSV"
            >
              <FileDown className="h-3.5 w-3.5" /> Export Log CSV
            </button>
          </div>

          {/* PANEL PENCARIAN & FILTER LANJUTAN */}
          <div className="p-4 bg-slate-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Keyword search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cari Kata Kunci</label>
              <div className="relative">
                <input
                  id="search-history-query"
                  type="text"
                  placeholder="Cari nama, kode, keterangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1 text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* 2. Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kategori Barang</label>
              <select
                id="filter-history-kategori"
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Pupuk">Pupuk</option>
                <option value="Bibit / Benih">Bibit &amp; Benih</option>
                <option value="Pestisida & Obat Pertanian">Pestisida &amp; Obat Pertanian</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            {/* 3. Start Date input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mulai Tanggal</label>
              <input
                id="filter-history-startdate"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* 4. End Date input -> includes quick reset button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hingga Tanggal</label>
              <div className="flex gap-2">
                <input
                  id="filter-history-enddate"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
                {(filterKategori !== "Semua" || filterStartDate || filterEndDate || searchQuery) && (
                  <button
                    id="btn-reset-history-filters"
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterKategori("Semua");
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    className="px-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 whitespace-nowrap"
                    title="Mereset semua isian kriteria filter"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-[110px]">Tanggal</th>
                  <th className="py-2.5 px-4 w-[110px]">Kode Barang</th>
                  <th className="py-2.5 px-4">Nama Komoditas</th>
                  <th className="py-2.5 px-4 text-center">Jumlah Tambah</th>
                  <th className="py-2.5 px-4 text-right">Modal/Unit</th>
                  <th className="py-2.5 px-4 text-right">Total Investasi</th>
                  <th className="py-2.5 px-4">Keterangan Catatan</th>
                  {props.accessMode === "admin" && <th className="py-2.5 px-4 text-center w-[160px]">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                {paginatedHistori.length === 0 ? (
                  <tr>
                    <td colSpan={props.accessMode === "admin" ? 8 : 7} className="py-6 text-center text-gray-400 text-xs font-medium">
                      {props.stokHistoriData.length === 0 
                        ? "Belum terdapat log riwayat pertambahan atau manipulasi stok barang."
                        : "Tidak ada log riwayat yang cocok dengan pencarian Anda."}
                    </td>
                  </tr>
                ) : (
                  paginatedHistori.map((log) => {
                    const totalCost = log.qtyAdded * log.hargaModal;
                    const isPositive = log.qtyAdded > 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-gray-500">
                          {log.tgl}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {log.kodeBarang}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          <div className="font-semibold text-slate-900">{log.namaBarang}</div>
                          <div className="text-[9.5px] text-gray-400 font-semibold flex flex-wrap items-center gap-1.5 mt-0.5 select-none">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider uppercase">
                              {getBarangKategori(log.namaBarang)}
                            </span>
                            <span>• ID Ref: {log.stokId}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {isPositive ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                              +{log.qtyAdded} Pcs
                            </span>
                          ) : (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                              {log.qtyAdded} Pcs
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                          Rp {log.hargaModal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900">
                          Rp {totalCost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 italic text-[11px]">
                          {log.keterangan || "Restok barang dagang"}
                        </td>
                        
                        {props.accessMode === "admin" && (
                          <td className="py-2 px-4 text-center">
                            {confirmDeleteLogId === log.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    props.onDeleteStokHistori(log.id);
                                    setConfirmDeleteLogId(null);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] px-2 py-0.5 rounded font-extrabold cursor-pointer transition active:scale-95"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteLogId(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteLogId(log.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-red-650 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded transition font-bold cursor-pointer"
                                title="Hapus catatan transaksi ini"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" /> Hapus Log
                              </button>
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

          {/* Pagination Controls for Riwayat */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-xs text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-800">{totalItemsRiwayat > 0 ? startIndexRiwayat + 1 : 0}</span> s/d{" "}
              <span className="font-bold text-gray-800">{endIndexRiwayat}</span> dari{" "}
              <span className="font-bold text-gray-800">{totalItemsRiwayat}</span> log riwayat
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePageRiwayat === 1}
                onClick={() => setCurrentPageRiwayat(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition text-gray-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer active:scale-95"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-gray-700 font-mono bg-white border border-gray-150 rounded-lg">
                Halaman {activePageRiwayat} / {totalPagesRiwayat}
              </span>
              <button
                type="button"
                disabled={activePageRiwayat === totalPagesRiwayat}
                onClick={() => setCurrentPageRiwayat(prev => Math.min(totalPagesRiwayat, prev + 1))}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition text-gray-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer active:scale-95"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRASI BARANG BARU MODAL */}
      {isAddProductModelOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-red-600 px-5 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                <h3 className="font-bold text-sm">Registrasi Barang Logistik Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddProductModelOpen(false)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4">
              {errorAdd && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg leading-relaxed animate-shake">
                  {errorAdd}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kode Barang</label>
                  <input
                    id="new-stok-kode"
                    type="text"
                    required
                    placeholder="Contoh: BRG-10"
                    value={newKode}
                    onChange={(e) => setNewKode(e.target.value.toUpperCase())}
                    className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stok Awal Fisik</label>
                  <input
                    id="new-stok-qty"
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newQty}
                    onChange={(e) => setNewQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Komoditas Barang</label>
                <input
                  id="new-stok-nama"
                  type="text"
                  required
                  placeholder="Contoh: Bibit Jagung Hibrida F1"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Harga Modal (Rp / Unit)</label>
                  <input
                    id="new-stok-modal"
                    type="number"
                    required
                    min="0"
                    placeholder="Harga beli pokok"
                    value={newHargaModal === 0 ? "" : newHargaModal}
                    onChange={(e) => setNewHargaModal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Harga Jual (Rp / Unit)</label>
                  <input
                    id="new-stok-jual"
                    type="number"
                    required
                    min="1"
                    placeholder="Harga jual eceran"
                    value={newHargaJual === 0 ? "" : newHargaJual}
                    onChange={(e) => setNewHargaJual(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModelOpen(false)}
                  className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg transition font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-registrasi"
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg shadow-xs transition cursor-pointer"
                >
                  Daftarkan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK / ADJUST WORKFLOW MODAL */}
      {selectedManageItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-red-600 px-5 py-3 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Manajemen Stok &amp; Logistik</h3>
                <p className="text-[10px] text-red-100 mt-0.5">{selectedManageItem.nama} ({selectedManageItem.kode})</p>
              </div>
              <button 
                onClick={() => setSelectedManageItem(null)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* TAB TOGGLE: RESTOCK vs DIRECT ADJUST */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setManageTab("restock")}
                className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                  manageTab === "restock" 
                    ? "border-red-600 text-red-600 bg-white" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                📝 Tambah Stok Baru (Restok)
              </button>
              <button
                type="button"
                onClick={() => setManageTab("adjust")}
                className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                  manageTab === "adjust" 
                    ? "border-red-600 text-red-600 bg-white" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                ⚙️ Koreksi Total Fisik
              </button>
            </div>
            
            <form onSubmit={handleManageSubmit} className="p-5 space-y-4">
              
              {manageTab === "restock" ? (
                <>
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-100 text-[11px] text-amber-800 flex items-start gap-1.5 leading-relaxed">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Fitur Restok ini akan <strong>menambahkan</strong> kuantitas ke dalam stok fisik aktual saat ini, serta mencatatnya di Log Riwayat Penambahan Stok di bawah.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Tambahan</label>
                      <input
                        id="restock-qty"
                        type="number"
                        required
                        min="1"
                        value={restockQty}
                        onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tanggal Datang</label>
                      <input
                        id="restock-date"
                        type="date"
                        required
                        value={restockDate}
                        onChange={(e) => setRestockDate(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-semibold text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Harga Modal Restok Baru (Rp / Unit)</label>
                    <input
                      id="restock-harga-modal"
                      type="number"
                      required
                      min="0"
                      value={restockHargaModal}
                      onChange={(e) => setRestockHargaModal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold text-emerald-700"
                    />
                    <span className="text-[9px] text-gray-400 mt-0.5">Def: Harga modal awal ({selectedManageItem.hargaModal?.toLocaleString('id-ID') || 'N/A'})</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Keterangan Catatan Restok</label>
                    <input
                      id="restock-ket"
                      type="text"
                      placeholder="Masukkan catatan audit di sini"
                      value={restockKet}
                      onChange={(e) => setRestockKet(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-indigo-50 p-2.5 rounded border border-indigo-100 text-[11px] text-indigo-800 flex items-start gap-1.5 leading-relaxed">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Gunakan fitur ini untuk <strong>merubah langsung</strong> kuantitas sisa stok fisik (Overriding). Sisa stok fisik saat ini: <strong>{selectedManageItem.qty} Unit</strong>.</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kuantitas Stok Fisik Baru</label>
                    <input
                      id="adjust-qty"
                      type="number"
                      required
                      min="0"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-xs font-mono font-bold"
                    />
                    <span className="text-[9px] text-gray-400 mt-1">Perbedaan kuantitas akan dicatat di log penyesuaian.</span>
                  </div>
                </>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedManageItem(null)}
                  className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg transition font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-restock"
                  type="submit"
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg shadow-xs transition cursor-pointer"
                >
                  {manageTab === "restock" ? "Tambahkan Stok & Log" : "Sesuaikan Stok Fisik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
