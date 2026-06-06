/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  DollarSign,
  Activity,
  ArrowUpRight,
  Info,
  Layers,
  Percent,
  X,
  CreditCard,
  FileDown
} from 'lucide-react';
import { FixedAsset, RekeningBank, CoaAccount } from '../types';
// @ts-ignore
import fixedAssetsIcon from '../assets/images/fixed_assets_icon_1779887308779.png';

interface AsetTetapProps {
  fixedAssets: FixedAsset[];
  rekeningData: RekeningBank[];
  coaData: CoaAccount[];
  accessMode: "admin" | "view";
  onAddAsset: (
    asset: FixedAsset, 
    recordJournal: boolean, 
    cashCoa: string
  ) => void;
  onDepreciateAsset: (
    id: string, 
    tgl: string, 
    nominal: number
  ) => void;
  onDisposeAsset: (
    id: string,
    tgl: string,
    hargaPelepasan: number,
    cashCoa: string,
    ket: string
  ) => void;
  onDeleteAsset: (id: string) => void;
}

export function AsetTetap(props: AsetTetapProps) {
  const [activeTab, setActiveTab] = useState<"aktif" | "dilepas">("aktif");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepreciateModalOpen, setIsDepreciateModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  // Form states for Add Asset
  const [newId, setNewId] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKategori, setNewKategori] = useState<FixedAsset["kategori"]>("Peralatan");
  const [newTgl, setNewTgl] = useState(new Date().toISOString().split('T')[0]);
  const [newHarga, setNewHarga] = useState<number>(0);
  const [newResidu, setNewResidu] = useState<number>(0);
  const [newUmur, setNewUmur] = useState<number>(5);
  const [newMetode, setNewMetode] = useState<FixedAsset["metodePenyusutan"]>("Garis Lurus");
  const [recordPurchaseJournal, setRecordPurchaseJournal] = useState(false);
  const [purchasePayCoa, setPurchasePayCoa] = useState("");

  // Form states for Depreciate Asset
  const [depreciateTgl, setDepreciateTgl] = useState(new Date().toISOString().split('T')[0]);
  const [depreciateNominal, setDepreciateNominal] = useState<number>(0);

  // Form states for Dispose Asset
  const [disposeTgl, setDisposeTgl] = useState(new Date().toISOString().split('T')[0]);
  const [disposeHarga, setDisposeHarga] = useState<number>(0);
  const [disposeCashCoa, setDisposeCashCoa] = useState("");
  const [disposeKet, setDisposeKet] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  // Auto set default COA for purchase and disposal
  useEffect(() => {
    if (props.rekeningData.length > 0) {
      setPurchasePayCoa("1-1101");
      setDisposeCashCoa("1-1101");
    }
  }, [props.rekeningData]);

  // Handle auto calculations in Add Asset modal
  const suggestedDepreciationPerYear = newHarga > 0 && newUmur > 0 && newMetode === "Garis Lurus"
    ? Math.round(Math.max(0, newHarga - newResidu) / newUmur)
    : 0;

  // Filter lists
  const filteredAssets = props.fixedAssets.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "aktif" ? item.status === "Aktif" : item.status === "Dilepas";
    const matchesCategory = categoryFilter === "Semua" ? true : item.kategori === categoryFilter;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Calculate current page pagination indices
  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, activeTab, pageSize]);

  // Statistics metrics
  const activeAssets = props.fixedAssets.filter(a => a.status === "Aktif");
  const totalAcquisition = activeAssets.reduce((sum, a) => sum + a.hargaPerolehan, 0);
  const totalAccumulated = activeAssets.reduce((sum, a) => sum + a.akumulasiPenyusutan, 0);
  const totalBookValue = Math.max(0, totalAcquisition - totalAccumulated);

  const disposedAssets = props.fixedAssets.filter(a => a.status === "Dilepas");
  const totalDisposalRevenue = disposedAssets.reduce((sum, a) => sum + (a.hargaPelepasan || 0), 0);
  const totalGainLoss = disposedAssets.reduce((sum, a) => sum + (a.untungRugiPelepasan || 0), 0);

  // Submit Handler for New Asset
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanId = newId.trim();
    if (!cleanId) {
      setErrorMsg("ID Aset wajib diisi.");
      return;
    }

    // Check if ID is already used
    const isIdUsed = props.fixedAssets.some(a => a.id.toLowerCase() === cleanId.toLowerCase());
    if (isIdUsed) {
      setErrorMsg(`ID Aset "${cleanId}" sudah digunakan. Silakan gunakan ID lain.`);
      return;
    }

    if (!newNama.trim()) {
      setErrorMsg("Nama aset wajib diisi.");
      return;
    }
    if (newHarga <= 0) {
      setErrorMsg("Harga perolehan wajib lebih besar dari Rp 0.");
      return;
    }
    if (newResidu < 0) {
      setErrorMsg("Nilai sisa / residu tidak boleh negatif.");
      return;
    }
    if (newResidu >= newHarga) {
      setErrorMsg("Nilai residu harus lebih kecil dari harga perolehan.");
      return;
    }
    if (newUmur <= 0) {
      setErrorMsg("Umur ekonomis minimal adalah 1 tahun.");
      return;
    }

    const assetObj: FixedAsset = {
      id: cleanId,
      nama: newNama.trim(),
      kategori: newKategori,
      tglPerolehan: newTgl,
      hargaPerolehan: newHarga,
      nilaiResidu: newResidu,
      umurEkonomis: newUmur,
      metodePenyusutan: newMetode,
      akumulasiPenyusutan: 0,
      status: "Aktif"
    };

    props.onAddAsset(assetObj, recordPurchaseJournal, recordPurchaseJournal ? purchasePayCoa : "");

    // Reset Form
    setNewId("");
    setNewNama("");
    setNewHarga(0);
    setNewResidu(0);
    setNewUmur(5);
    setRecordPurchaseJournal(false);
    setIsAddModalOpen(false);
  };

  // Submit Handler for Depreciate Asset
  const handleDepreciateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedAsset) return;
    if (depreciateNominal <= 0) {
      setErrorMsg("Nominal penyusutan harus lebih besar dari Rp 0.");
      return;
    }

    const maxDepreciation = selectedAsset.hargaPerolehan - selectedAsset.nilaiResidu - selectedAsset.akumulasiPenyusutan;
    if (depreciateNominal > maxDepreciation) {
      setErrorMsg(`Penyusutan melebihi nilai yang diperbolehkan. Maksimal penyusutan tersisa adalah Rp ${maxDepreciation.toLocaleString('id-ID')}.`);
      return;
    }

    props.onDepreciateAsset(selectedAsset.id, depreciateTgl, depreciateNominal);
    setIsDepreciateModalOpen(false);
    setSelectedAsset(null);
  };

  // Submit Handler for Dispose Asset
  const handleDisposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedAsset) return;
    if (disposeHarga < 0) {
      setErrorMsg("Harga pelepasan tidak boleh negatif.");
      return;
    }
    if (!disposeCashCoa) {
      setErrorMsg("Silakan tentukan akun kas penerima dana pelepasan.");
      return;
    }

    props.onDisposeAsset(
      selectedAsset.id,
      disposeTgl,
      disposeHarga,
      disposeCashCoa,
      disposeKet.trim() || `Pelepasan aset tetap: ${selectedAsset.nama}`
    );

    setIsDisposeModalOpen(false);
    setSelectedAsset(null);
    setDisposeHarga(0);
    setDisposeKet("");
  };

  const handleOpenDepreciate = (asset: FixedAsset) => {
    setErrorMsg("");
    setSelectedAsset(asset);
    
    // Auto fill suggested annual depreciation value
    const maxDepr = asset.hargaPerolehan - asset.nilaiResidu - asset.akumulasiPenyusutan;
    const suggested = asset.metodePenyusutan === "Garis Lurus"
      ? Math.min(Math.round((asset.hargaPerolehan - asset.nilaiResidu) / asset.umurEkonomis), maxDepr)
      : maxDepr;

    setDepreciateNominal(Math.max(0, suggested));
    setIsDepreciateModalOpen(true);
  };

  const handleOpenDispose = (asset: FixedAsset) => {
    setErrorMsg("");
    setSelectedAsset(asset);
    const bookValue = asset.hargaPerolehan - asset.akumulasiPenyusutan;
    setDisposeHarga(Math.max(0, bookValue));
    setIsDisposeModalOpen(true);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Daftar Aset Tetap - Status ${activeTab.toUpperCase()}\r\n`;
    if (activeTab === "aktif") {
      csvContent += "ID Aset,Nama Aset,Kategori,Tgl Perolehan,Biaya Perolehan (Rp),Nilai Residu (Rp),Umur Ekonomis (Tahun),Metode,Akumulasi Penyusutan (Rp),Nilai Buku Akhir (Rp)\r\n";
      filteredAssets.forEach(item => {
        const row = [
          `"${item.id}"`,
          `"${item.nama.replace(/"/g, '""')}"`,
          `"${item.kategori}"`,
          `"${item.tglPerolehan}"`,
          item.hargaPerolehan.toString(),
          item.nilaiResidu.toString(),
          item.umurEkonomis.toString(),
          `"${item.metodePenyusutan}"`,
          item.akumulasiPenyusutan.toString(),
          (item.hargaPerolehan - item.akumulasiPenyusutan).toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "ID Aset,Nama Aset,Kategori,Tgl Perolehan,Biaya Perolehan (Rp),Tgl Pelepasan,Harga Jual Pelepasan (Rp),Nilai Buku Akhir (Rp),Untung/Rugi Pelepasan (Rp)\r\n";
      filteredAssets.forEach(item => {
        const row = [
          `"${item.id}"`,
          `"${item.nama.replace(/"/g, '""')}"`,
          `"${item.kategori}"`,
          `"${item.tglPerolehan}"`,
          item.hargaPerolehan.toString(),
          `"${item.tglPelepasan || ''}"`,
          (item.hargaPelepasan || 0).toString(),
          (item.hargaPerolehan - item.akumulasiPenyusutan).toString(),
          (item.untungRugiPelepasan || 0).toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ASET_TETAP_${activeTab.toUpperCase()}_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="aset-tetap-screen" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0">
            <img 
              src={fixedAssetsIcon} 
              alt="Aset Tetap" 
              className="h-[41px] w-[59px] bg-[#f6f0f0] object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 leading-tight">Pengelolaan Aset Tetap</h1>
            <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">Pendataan Aset Desa, Inventaris, Penyusutan &amp; Pelepasan Aset</p>
          </div>
        </div>

        {/* TOP INTERACTIVE ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            id="export-asettetap-csv-btn"
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Download fixed assets register as CSV"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
          {props.accessMode === "admin" && (
            <button
              id="btn-tambah-aset-tetap"
              onClick={() => {
                setErrorMsg("");
                const nextId = "AST-" + String(props.fixedAssets.length + 1).padStart(3, "0");
                setNewId(nextId);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-[#f91f1f] hover:bg-red-750 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Tambah Aset Baru
            </button>
          )}

          {/* TABS SELECTION */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => setActiveTab("aktif")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "aktif"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Aset Aktif ({activeAssets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dilepas")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "dilepas"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Dilepas ({disposedAssets.length})
            </button>
          </div>
        </div>
      </div>

      {/* STATS BENTO BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
        <div className="bg-white p-4.5 rounded-xl border border-slate-150 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Total Perolehan Aset</p>
          <p className="text-lg font-black text-slate-905 mt-1 font-mono">Rp {totalAcquisition.toLocaleString('id-ID')}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
            <Layers className="h-3.5 w-3.5 text-slate-450" />
            <span>Dari {activeAssets.length} unit terdaftar</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-150 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Akumulasi Penyusutan</p>
          <p className="text-lg font-black text-red-650 mt-1 font-mono">Rp {totalAccumulated.toLocaleString('id-ID')}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <span>Penyusutan berjalan</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-150 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Nilai Buku Bersih (Net)</p>
          <p className="text-lg font-black text-emerald-600 mt-1 font-mono">Rp {totalBookValue.toLocaleString('id-ID')}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>{totalAcquisition > 0 ? Math.round((totalBookValue/totalAcquisition)*100) : 0}% nilai buku tersisa</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-150 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Untung Rugi Pelepasan</p>
          <p className={`text-lg font-black mt-1 font-mono ${totalGainLoss >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
            {totalGainLoss >= 0 ? "+" : ""}Rp {totalGainLoss.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
            {totalGainLoss >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
            <span>Realisasi dari {disposedAssets.length} aset lepas</span>
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <input
            id="asset-table-search"
            type="text"
            placeholder="Cari aset atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-slate-50 font-medium"
          />

          {/* Category Filter */}
          <select
            id="asset-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold cursor-pointer"
          >
            <option value="Semua">Semua Kategori ({props.fixedAssets.length})</option>
            <option value="Peralatan">Peralatan</option>
            <option value="Kendaraan">Kendaraan</option>
            <option value="Mesin">Mesin</option>
            <option value="Gedung & Bangunan">Gedung &amp; Bangunan</option>
            <option value="Tanah">Tanah</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Menampilkan {filteredAssets.length} data aset
        </div>
      </div>

      {/* DETAILED REGISTER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-left">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">ID Aset</th>
                <th className="py-3 px-4">Nama Aset Tetap</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tgl Perolehan</th>
                <th className="py-3 px-4 text-right">Harga Perolehan</th>
                {activeTab === "aktif" ? (
                  <>
                    <th className="py-3 px-4 text-right">Akum. Penyusutan</th>
                    <th className="py-3 px-4 text-right">Nilai Buku Net</th>
                    <th className="py-3 px-4 text-center">Tindakan Buku</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">Tgl Pelepasan</th>
                    <th className="py-3 px-4 text-right">Harga Pelepas</th>
                    <th className="py-3 px-4 text-right">Untung/Rugi</th>
                    <th className="py-3 px-4 text-center">Aksi Log</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "aktif" ? 8 : 8} className="text-center py-16 text-slate-400 font-semibold">
                    Tidak ada pendataan aset tetap yang cocok dengan filter atau kriteria pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map(asset => {
                  const bookVal = Math.max(0, asset.hargaPerolehan - asset.akumulasiPenyusutan);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3 px-4 font-mono font-bold text-red-650">{asset.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-850">
                        {asset.nama}
                        {asset.metodePenyusutan !== "Tanpa Penyusutan" && (
                          <span className="block text-[9px] text-slate-400 font-mono font-medium mt-0.5">
                            Metode: {asset.metodePenyusutan} ({asset.umurEkonomis} tahun)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {asset.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{asset.tglPerolehan}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        Rp {asset.hargaPerolehan.toLocaleString('id-ID')}
                      </td>
                      
                      {activeTab === "aktif" ? (
                        <>
                          <td className="py-3 px-4 text-right font-mono text-red-650">
                            Rp {asset.akumulasiPenyusutan.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 bg-emerald-50/5">
                            Rp {bookVal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {props.accessMode === "admin" && asset.metodePenyusutan !== "Tanpa Penyusutan" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDepreciate(asset)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer"
                                  title="Alokasikan beban penyusutan di jurnal buku besar"
                                >
                                  Susutkan
                                </button>
                              )}
                              {props.accessMode === "admin" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDispose(asset)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer"
                                  title="Proses pelepasan aset (Dijual, Dihibahkan, atau Dihapus karena rusak)"
                                >
                                  Lepaskan
                                </button>
                              )}
                              {props.accessMode === "admin" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Hapus registrasi aset "${asset.nama}"? Tindakan ini hanya menghapus kartu registers, jurnal pembelian yang terlanjur dipost tidak terpengaruh.`)) {
                                      props.onDeleteAsset(asset.id);
                                    }
                                  }}
                                  className="text-slate-350 hover:text-red-650 p-1 cursor-pointer transition"
                                  title="Hapus aset"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-mono text-slate-500">{asset.tglPelepasan || "-"}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-800">
                            Rp {(asset.hargaPelepasan || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-bold ${
                              (asset.untungRugiPelepasan || 0) >= 0 ? "text-emerald-600" : "text-amber-600"
                            }`}>
                              {(asset.untungRugiPelepasan || 0) >= 0 ? "Laba: +" : "Rugi: "}
                              Rp {Math.abs(asset.untungRugiPelepasan || 0).toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {props.accessMode === "admin" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus permanen histori log pelepasan aset "${asset.nama}"?`)) {
                                    props.onDeleteAsset(asset.id);
                                  }
                                }}
                                className="text-slate-350 hover:text-red-650 p-1 cursor-pointer transition inline-flex items-center"
                                title="Hapus catatan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              id="asset-page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-red-500 text-slate-700 bg-white font-medium cursor-pointer"
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>
              Menampilkan {filteredAssets.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, filteredAssets.length)} dari {filteredAssets.length} aset
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="asset-prev-pag"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition font-semibold"
            >
              Sebelumnya
            </button>
            <span className="px-1 select-none">
              Halaman <strong>{safeCurrentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              id="asset-next-pag"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition font-semibold"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW FIXED ASSET */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-150 flex flex-col justify-between max-h-[92vh] animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-500" /> Registrasi Aset Baru
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 overflow-y-auto flex-1 space-y-4">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ID Aset Custom</label>
                  <input
                    id="asset-form-id"
                    type="text"
                    required
                    placeholder="AST-003"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-mono font-bold"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Aset Tetap</label>
                  <input
                    id="asset-form-name"
                    type="text"
                    required
                    placeholder="Misal: Mesin Giling Padi, Mobil Pick up L300"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kategori Aset</label>
                  <select
                    id="asset-form-category"
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium cursor-pointer focus:outline-none focus:border-red-500"
                  >
                    <option value="Peralatan">Peralatan (Kantor / Usaha)</option>
                    <option value="Kendaraan">Kendaraan_Operasional</option>
                    <option value="Mesin">Mesin Produksi</option>
                    <option value="Gedung & Bangunan">Gedung &amp; Bangunan</option>
                    <option value="Tanah">Tanah / Lahan Desa</option>
                    <option value="Lainnya">Kategori Lainnya</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanggal Perolehan</label>
                  <input
                    id="asset-form-date"
                    type="date"
                    required
                    value={newTgl}
                    onChange={(e) => setNewTgl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Harga Perolehan (Rp)</label>
                  <input
                    id="asset-form-cost"
                    type="number"
                    required
                    min={0}
                    value={newHarga || ""}
                    onChange={(e) => setNewHarga(Number(e.target.value))}
                    placeholder="Nilai Beli"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nilai Sisa / Residu (Rp)</label>
                  <input
                    id="asset-form-salvage"
                    type="number"
                    min={0}
                    value={newResidu || ""}
                    onChange={(e) => setNewResidu(Number(e.target.value))}
                    placeholder="Nilai Akhir"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Umur Ekonomis (Tahun)</label>
                  <input
                    id="asset-form-useful"
                    type="number"
                    min={1}
                    required
                    value={newUmur || ""}
                    onChange={(e) => setNewUmur(Number(e.target.value))}
                    placeholder="Masa Pakai"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metode Penyusutan</label>
                <select
                  id="asset-form-deprmethod"
                  value={newMetode}
                  onChange={(e) => setNewMetode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium cursor-pointer"
                >
                  <option value="Garis Lurus">Metode Garis Lurus (Straight Line)</option>
                  <option value="Tanpa Penyusutan">Tanpa Penyusutan (Misal: Tanah)</option>
                </select>
              </div>

              {/* INTEGRATION: OPTION TO AUTOMATICALLY POST TO LEDGER */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="checkbox-record-journal-purchase"
                    type="checkbox"
                    checked={recordPurchaseJournal}
                    disabled={props.rekeningData.length === 0}
                    onChange={(e) => setRecordPurchaseJournal(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="checkbox-record-journal-purchase" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Catat Jurnal Pembelian via Kas / Bank
                  </label>
                </div>

                {recordPurchaseJournal && (
                  <div className="flex flex-col gap-1 text-left animate-in fade-in duration-150">
                    <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Sumber Dana (Rekening Penerbit Kredit)</label>
                    <select
                      id="asset-form-purchase-source"
                      value={purchasePayCoa}
                      onChange={(e) => setPurchasePayCoa(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-250 bg-white text-slate-900 font-bold rounded-lg cursor-pointer focus:outline-none focus:border-red-500"
                    >
                      {props.rekeningData.filter(r => (r.status || "Aktif") === "Aktif").map(r => {
                        const mappedCoa = "1-110" + r.id.replace("bnk-", "");
                        return (
                          <option key={r.id} value={mappedCoa}>
                            {mappedCoa} - {r.nama} (Saldo: Rp {r.saldo.toLocaleString('id-ID')})
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-[9px] text-slate-400 leading-normal block mt-1 font-medium">
                      Otomatis mendebet Akun Aset Tetap dan mengkredit Rekening di atas senilai <strong>Rp {newHarga.toLocaleString('id-ID')}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* ESTIMATION SUMMARY BANNER */}
              {newMetode === "Garis Lurus" && newHarga > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-150 p-3.5 rounded-xl text-xs flex items-start gap-2 text-emerald-850">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Estimasi Penyusutan Garis Lurus:</p>
                    <p className="text-slate-600 leading-normal font-medium">Akun alokasi beban penyusutan diakumulasi senilai <strong className="text-emerald-700">Rp {suggestedDepreciationPerYear.toLocaleString('id-ID')} / Tahun</strong> selama {newUmur} tahun, menyisakan nilai residu Rp {newResidu.toLocaleString('id-ID')}.</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-150 p-3 rounded-lg text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-semibold text-xs rounded transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-add-asset"
                type="button"
                onClick={handleCreateAsset}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
              >
                Daftarkan Aset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WRITE OFF / DEPRECIATION OF AN ASSET */}
      {isDepreciateModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-150 flex flex-col justify-between animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="h-4.5 w-4.5 text-red-500" /> Alokasikan Penyusutan
              </h2>
              <button 
                type="button" 
                onClick={() => setIsDepreciateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleDepreciateSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>Nama Aset: <strong className="text-slate-900">{selectedAsset.nama}</strong></p>
                <p>Harga Perolehan: <strong className="text-slate-900">Rp {selectedAsset.hargaPerolehan.toLocaleString('id-ID')}</strong></p>
                <p>Telah Disusutkan: <strong className="text-red-650">Rp {selectedAsset.akumulasiPenyusutan.toLocaleString('id-ID')}</strong></p>
                <p>Nilai Buku Sekarang: <strong className="text-emerald-700 font-bold">Rp {(selectedAsset.hargaPerolehan - selectedAsset.akumulasiPenyusutan).toLocaleString('id-ID')}</strong></p>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanggal Penyusutan</label>
                <input
                  id="depreciate-form-date"
                  type="date"
                  required
                  value={depreciateTgl}
                  onChange={(e) => setDepreciateTgl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Debit Beban Penyusutan (Rp)</label>
                <input
                  id="depreciate-form-value"
                  type="number"
                  required
                  min={1}
                  value={depreciateNominal || ""}
                  onChange={(e) => setDepreciateNominal(Number(e.target.value))}
                  placeholder="Nilai Penyusutan"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-extrabold"
                />
                <span className="text-[9px] text-slate-400 leading-normal block mt-1">Otomatis mendebet Beban Penyusutan (COA 6-2005) dan mengkredit Akumulasi Penyusutan yang sesuai.</span>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-150 p-2.5 rounded text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDepreciateModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-semibold text-xs rounded transition"
              >
                Batal
              </button>
              <button
                id="btn-confirm-depreciate-asset"
                type="button"
                onClick={handleDepreciateSubmit}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
              >
                Susutkan Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPOSE / PELEPASAN FIXED ASSET */}
      {isDisposeModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-150 flex flex-col justify-between animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="h-4.5 w-4.5 text-amber-500" /> Pelepasan Aset Tetap
              </h2>
              <button 
                type="button" 
                onClick={() => setIsDisposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleDisposeSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>Aset Te-lepas: <strong className="text-slate-900">{selectedAsset.nama}</strong></p>
                <p>Harga Perolehan: <strong className="text-slate-900">Rp {selectedAsset.hargaPerolehan.toLocaleString('id-ID')}</strong></p>
                <p>Total Penyusutan: <strong className="text-slate-900">Rp {selectedAsset.akumulasiPenyusutan.toLocaleString('id-ID')}</strong></p>
                <p>Nilai Buku Terakhir: <strong className="text-red-750 font-bold">Rp {(selectedAsset.hargaPerolehan - selectedAsset.akumulasiPenyusutan).toLocaleString('id-ID')}</strong></p>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanggal Pelepasan</label>
                <input
                  id="dispose-form-date"
                  type="date"
                  required
                  value={disposeTgl}
                  onChange={(e) => setDisposeTgl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Harga Pelepasan / Jual (Rp)</label>
                <input
                  id="dispose-form-value"
                  type="number"
                  required
                  min={0}
                  value={disposeHarga || ""}
                  onChange={(e) => setDisposeHarga(Number(e.target.value))}
                  placeholder="Nilai Jual"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                />
                <span className="text-[9px] text-slate-400 leading-normal block mt-1">Gunakan Rp 0 jika aset di-write off / di-buang karena rusak tanpa ada hasil penjualan kas.</span>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Rekening Penerima Uang Kas</label>
                <select
                  id="dispose-form-cash-destination"
                  value={disposeCashCoa}
                  onChange={(e) => setDisposeCashCoa(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-250 bg-white font-bold text-slate-900 rounded-lg cursor-pointer"
                >
                  {props.rekeningData.filter(r => (r.status || "Aktif") === "Aktif").map(r => {
                    const mappedCoa = "1-110" + r.id.replace("bnk-", "");
                    return (
                      <option key={r.id} value={mappedCoa}>
                        {mappedCoa} - {r.nama} (Saldo: Rp {r.saldo.toLocaleString('id-ID')})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Keterangan Pelepasan</label>
                <textarea
                  id="dispose-form-note"
                  placeholder="Sebutkan alasan pelepasan... Misal: Dijual karena rusak berat, Dihibahkan ke desa."
                  value={disposeKet}
                  onChange={(e) => setDisposeKet(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              {/* AUTOMATIC DOUBLE ENTRY PREVIEW ACCORDING TO DISPOSAL PRICE */}
              {disposeHarga >= 0 && (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-150 text-[11px] text-amber-900 space-y-1 text-left">
                  <p className="font-bold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Jurnal &amp; Realisasi Transaksi:</p>
                  {(() => {
                    const bookVal = selectedAsset.hargaPerolehan - selectedAsset.akumulasiPenyusutan;
                    const diff = disposeHarga - bookVal;
                    if (diff > 0) {
                      return <p className="text-emerald-700 leading-normal font-medium mt-1">Pelepasan menghasilkan <strong className="font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Laba Pelepasan senilai Rp {diff.toLocaleString('id-ID')}</strong> (Dipost ke Pendapatan Lain-lain 4-2003).</p>;
                    } else if (diff < 0) {
                      return <p className="text-rose-700 leading-normal font-medium mt-1">Pelepasan menghasilkan <strong className="font-extrabold uppercase bg-red-100 text-red-900 px-1.5 py-0.5 rounded">Rugi Pelepasan senilai Rugi: Rp {Math.abs(diff).toLocaleString('id-ID')}</strong> (Dipost ke Beban Lain-lain 6-2010).</p>;
                    } else {
                      return <p className="text-slate-600 leading-normal font-medium mt-1">Realisasi sesuai dengan Nilai Buku. Tidak ada laba atau rugi pelepasan.</p>;
                    }
                  })()}
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-150 p-2.5 rounded text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDisposeModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-semibold text-xs rounded transition"
              >
                Batal
              </button>
              <button
                id="btn-confirm-dispose-asset"
                type="button"
                onClick={handleDisposeSubmit}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
              >
                Proses Lepas Aset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
