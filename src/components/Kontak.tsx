/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  Plus, 
  X, 
  MapPin, 
  Building2, 
  UserCheck,
  Building,
  CreditCard,
  FileText,
  FileDown,
  QrCode,
  Printer,
  ArrowLeftRight,
  ShieldCheck
} from 'lucide-react';
import { KontakLain } from '../types';

interface KontakProps {
  // Other contacts
  kontakLainData: KontakLain[];
  accessMode: "admin" | "view";
  onAddKontakLain: (kontak: KontakLain) => void;
  onUpdateKontakLain: (kontak: KontakLain) => void;
  onDeleteKontakLain: (id: string) => void;
  koperasiId?: string;
  koperasiName?: string;
  koperasiLogo?: string;
}

export function Kontak(props: KontakProps) {
  // Submenus / Sub-tabs: "karyawan" | "supplier" | "pelanggan"
  const [activeSubTab, setActiveSubTab] = useState<"karyawan" | "supplier" | "pelanggan">("karyawan");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Aktif" | "Non-Aktif">("Semua");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KontakLain | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Contact Form Inputs
  const [formNama, setFormNama] = useState("");
  const [formNoHp, setFormNoHp] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formJabatanPerusahaan, setFormJabatanPerusahaan] = useState("");
  const [formStatus, setFormStatus] = useState<"Aktif" | "Non-Aktif">("Aktif");
  const [formFoto, setFormFoto] = useState("");

  // ID Card Viewer states
  const [selectedIdCardContact, setSelectedIdCardContact] = useState<any | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Reset page when switching tabs or filters
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("Semua");
  }, [activeSubTab]);

  // Handle Edit/Add click
  const openAddModal = () => {
    setEditingItem(null);
    setFormNama("");
    setFormNoHp("628");
    setFormEmail("");
    setFormAlamat("");
    setFormJabatanPerusahaan("");
    setFormStatus("Aktif");
    setFormFoto("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: KontakLain) => {
    setEditingItem(item);
    setFormNama(item.nama);
    setFormNoHp(item.noHp || "628");
    setFormEmail(item.email || "");
    setFormAlamat(item.alamat || "");
    setFormJabatanPerusahaan(item.jabatanAtauPerusahaan || "");
    setFormStatus(item.status);
    setFormFoto(item.foto || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formNama.trim()) {
      setErrorMsg("Nama lengkap wajib diisi!");
      return;
    }

    const cleanedPhone = formNoHp.replace(/[^0-9]/g, '');
    if (cleanedPhone && !cleanedPhone.startsWith('62')) {
      setErrorMsg("Format nomor hp wajib menggunakan kode negara (Contoh: 6281234567890)");
      return;
    }

    const currentTipe = activeSubTab === "karyawan" 
      ? "Karyawan" 
      : activeSubTab === "supplier" 
        ? "Supplier" 
        : "Pelanggan";

    if (editingItem) {
      const updated: KontakLain = {
        ...editingItem,
        nama: formNama.trim(),
        noHp: cleanedPhone,
        email: formEmail.trim(),
        alamat: formAlamat.trim(),
        jabatanAtauPerusahaan: formJabatanPerusahaan.trim(),
        status: formStatus,
        foto: formFoto
      };
      props.onUpdateKontakLain(updated);
    } else {
      const newId = `CON-${Date.now().toString().slice(-6)}`;
      const created: KontakLain = {
        id: newId,
        nama: formNama.trim(),
        tipe: currentTipe,
        noHp: cleanedPhone,
        email: formEmail.trim(),
        alamat: formAlamat.trim(),
        jabatanAtauPerusahaan: formJabatanPerusahaan.trim(),
        status: formStatus,
        foto: formFoto
      };
      props.onAddKontakLain(created);
    }

    setIsModalOpen(false);
  };

  // Filter contacts lists based on active subtab
  const mappedTipe = activeSubTab === "karyawan" 
    ? "Karyawan" 
    : activeSubTab === "supplier" 
      ? "Supplier" 
      : "Pelanggan";

  const currentContacts = props.kontakLainData.filter(c => c.tipe === mappedTipe);

  const filteredContacts = currentContacts.filter(c => {
    const matchSearch = c.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.jabatanAtauPerusahaan && c.jabatanAtauPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchStatus = statusFilter === "Semua" ? true : c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + pageSize);

  // Statistics
  const totalKaryawan = props.kontakLainData.filter(c => c.tipe === "Karyawan").length;
  const totalSupplier = props.kontakLainData.filter(c => c.tipe === "Supplier").length;
  const totalPelanggan = props.kontakLainData.filter(c => c.tipe === "Pelanggan").length;

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Daftar Kontak - Kategori ${mappedTipe}\r\n`;
    csvContent += "ID Kontak,Nama Lengkap,No HP,Email,Alamat Lengkap,Jabatan / Perusahaan,Status Aktivitas\r\n";
    
    filteredContacts.forEach(c => {
      const row = [
        `"${c.id}"`,
        `"${c.nama.replace(/"/g, '""')}"`,
        `"${c.noHp}"`,
        `"${c.email}"`,
        `"${c.alamat.replace(/"/g, '""')}"`,
        `"${(c.jabatanAtauPerusahaan || '').replace(/"/g, '""')}"`,
        `"${c.status}"`
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KONTAK_${mappedTipe.toUpperCase()}_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="kontak-screen" className="space-y-6">

      {/* HEADER WITH COUNT OF ALL CONTACTS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-xl bg-[#f70a0a] flex items-center justify-center text-white shadow-md border border-red-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 leading-tight">Manajemen Kontak &amp; Kemitraan</h1>
            <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">Kelola data terpadu Karyawan, Supplier, dan Pelanggan</p>
          </div>
        </div>

        {/* SUBMENU TAB DIRECTORY NAVIGATION */}
        <div className="bg-slate-150 p-1 rounded-xl flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("karyawan")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "karyawan"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Karyawan ({totalKaryawan})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("supplier")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "supplier"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Supplier ({totalSupplier})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("pelanggan")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "pelanggan"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Pelanggan ({totalPelanggan})
          </button>
        </div>
      </div>

      {/* ACTION BUTTON & SEARCH & FILTER FOR OTHER CONTACTS */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-left">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari kontak ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-slate-50 font-medium w-full sm:w-56"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto self-stretch md:self-auto">
              <button
                type="button"
                onClick={exportToCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-initial"
                title="Download contact directory as CSV"
              >
                <FileDown className="h-4 w-4" /> Export CSV (Excel)
              </button>
              {props.accessMode === "admin" && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-initial"
                >
                  <UserPlus className="h-4 w-4" /> Tambah {activeSubTab === "karyawan" ? "Karyawan" : activeSubTab === "supplier" ? "Supplier" : "Pelanggan"}
                </button>
              )}
            </div>
          </div>

          {/* TABLE OF CONTACTS */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-left animate-in fade-in duration-150">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">
                      {activeSubTab === "karyawan" ? "Jabatan" : activeSubTab === "supplier" ? "Perusahaan / Brand" : "Asal / Alamat Instansi"}
                    </th>
                    <th className="py-3 px-4">Hubungi Kontak</th>
                    <th className="py-3 px-4">Alamat Rumah/Kantor</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {paginatedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400 font-semibold">
                        Belum ada data kontak terdaftar untuk kategori ini atau filter pencarian tidak sesuai.
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition duration-150">
                        <td className="py-3 px-4 font-mono font-bold text-red-650">{c.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-850">
                          {c.nama}
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            {activeSubTab === "karyawan" ? <Briefcase className="h-3.5 w-3.5 text-slate-400" /> : <Building className="h-3.5 w-3.5 text-slate-400" />}
                            {c.jabatanAtauPerusahaan || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {c.noHp && (
                            <a 
                              href={`https://wa.me/${c.noHp}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-medium font-mono"
                            >
                              <Phone className="h-3 w-3 text-emerald-500" /> +{c.noHp}
                            </a>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Mail className="h-3 w-3 text-slate-400" /> {c.email}
                            </span>
                          )}
                          {!c.noHp && !c.email && <span className="text-slate-350">-</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-slate-600 max-w-xs truncate">
                            {c.alamat ? (
                              <>
                                <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                                <span className="truncate">{c.alamat}</span>
                              </>
                            ) : "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Aktif" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {activeSubTab === "karyawan" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIdCardContact(c);
                                  setIsCardFlipped(false);
                                }}
                                className="text-red-650 hover:text-red-800 p-1 cursor-pointer transition flex items-center justify-center bg-red-50 hover:bg-red-100 rounded-md"
                                title="Lihat & Cetak ID Card QR"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(c)}
                              className="text-slate-500 hover:text-red-600 p-1 cursor-pointer transition"
                              title="Edit Kontak"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {props.accessMode === "admin" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus kontak "${c.nama}"?`)) {
                                    props.onDeleteKontakLain(c.id);
                                  }
                                }}
                                className="text-slate-350 hover:text-red-600 p-1 cursor-pointer transition"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-red-500 text-slate-700 bg-white font-medium cursor-pointer"
                >
                  {[10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>
                  Menampilkan {filteredContacts.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, filteredContacts.length)} dari {filteredContacts.length} kontak
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-bold">
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Sebelumnya
                </button>
                <span className="px-1 font-semibold text-slate-500">
                  Halaman <strong>{safeCurrentPage}</strong> dari <strong>{totalPages}</strong>
                </span>
                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>

      {/* MODAL DIALOG FOR ADD / EDIT OTHER CONTACTS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-150 flex flex-col justify-between animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-red-500" />
                {editingItem ? "Edit Data Kontak" : `Daftarkan ${activeSubTab === "karyawan" ? "Karyawan" : activeSubTab === "supplier" ? "Supplier" : "Pelanggan"}`}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Budi Budiman, S.E."
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {activeSubTab === "karyawan" ? "Jabatan / Posisi Kerja" : activeSubTab === "supplier" ? "Perusahaan / Nama Brand" : "Asal / Nama Pembeli"}
                </label>
                <input
                  type="text"
                  placeholder={
                    activeSubTab === "karyawan" 
                      ? "Misal: Bendahara, Kurir, Staff Gudang" 
                      : activeSubTab === "supplier" 
                        ? "Misal: PT Pupuk Indonesia, Brand Gula" 
                        : "Misal: Toko Kelontong, Retailer"
                  }
                  value={formJabatanPerusahaan}
                  onChange={(e) => setFormJabatanPerusahaan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 62812345..."
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="karyawan@koperasi.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alamat Lengkap</label>
                <textarea
                  placeholder="Isi alamat penagihan / pengiriman / domisili..."
                  rows={2}
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Foto Profil ID Card</label>
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                  {formFoto ? (
                    <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                      <img src={formFoto} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormFoto("")}
                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-dashed border-slate-250 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="kontak-photo-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormFoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                    />
                    <p className="text-[8px] text-slate-400 mt-1 leading-tight">Format JPG/PNG persegi, maks 1MB untuk ID Card.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left border-t border-slate-100 pt-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Kontak</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-150 p-2.5 rounded text-xs font-bold text-red-700 flex items-center gap-1.5 animate-bounce">
                  <span>{errorMsg}</span>
                </div>
              )}

            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-semibold text-xs rounded transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded shadow transition cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID CARD DUAL-SIDES VIEW MODAL */}
      {selectedIdCardContact && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-150">
            
            {/* Modal Header Controls */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">QR-ID Card Verifikator</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Fasilitas Keaslian Pejabat Koperasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedIdCardContact(null);
                  setIsCardFlipped(false);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Flipped Card Component */}
            <div className="w-[305px] h-[450px] [perspective:1000px] mb-6">
              <div 
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                  isCardFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* ID-CARD FRONT SIDE */}
                <div className="absolute w-full h-full rounded-2xl [backface-visibility:hidden] border border-slate-200 overflow-hidden shadow-2xl bg-white flex flex-col justify-between py-6 px-4 text-slate-950 select-none">
                  {/* Red and White Stripe Banner */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-600 via-rose-500 to-white flex items-center px-4">
                    <span className="text-[7px] font-black text-white/90 tracking-widest leading-none font-mono uppercase">KOPERASI INDONESIA</span>
                  </div>
                  
                  {/* Card Corporate Brand */}
                  <div className="mt-2 text-center">
                    <p className="text-[9px] font-extrabold text-red-650 tracking-[0.2em] uppercase font-mono leading-none">Kartu Identitas Resmi</p>
                    <h2 className="text-xs font-black text-slate-900 tracking-tight leading-tight uppercase mt-1">
                      {props.koperasiName || "Financial System"}
                    </h2>
                    <p className="text-[7px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">Digital Ledger Authentication System</p>
                    <div className="w-12 h-[1px] bg-red-600 mx-auto mt-2"></div>
                  </div>

                  {/* Profile Frame with active indicator */}
                  <div className="my-2 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-50 to-slate-100 border-2 border-red-500/30 p-1 shadow-sm relative flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-white relative">
                        {selectedIdCardContact.foto ? (
                          <img
                            src={selectedIdCardContact.foto}
                            alt={selectedIdCardContact.nama}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <Users className="h-10 w-10 text-slate-400/80" />
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white opacity-10 uppercase tracking-widest font-sans">
                              {selectedIdCardContact.nama.slice(0, 2)}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Authentic stamp ribbon */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white text-[8px] text-white font-extrabold animate-pulse" title="Status Aktif Terverifikasi">
                        ✓
                      </div>
                    </div>

                    <div className="text-center mt-2.5 space-y-1">
                      <h4 className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase px-1">{selectedIdCardContact.nama}</h4>
                      <p className="text-[10px] font-extrabold text-red-650 font-sans tracking-wide leading-none">{selectedIdCardContact.jabatanAtauPerusahaan || "Staff Operasional"}</p>
                      
                      <div className="inline-flex mt-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-bold text-slate-500 font-mono tracking-widest uppercase">
                        ID: {selectedIdCardContact.id}
                      </div>
                    </div>
                  </div>

                  {/* Decorative stamp seal / hologram details */}
                  <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between text-left">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-red-500/40 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <div className="text-[7px] leading-tight shrink-0">
                        <p className="font-extrabold text-slate-900 font-mono uppercase tracking-tighter">AUTHENTIC SECURE</p>
                        <p className="text-[6px] text-slate-400 font-mono font-medium">DocRef: {props.koperasiId || "KDMP"}-{selectedIdCardContact.id}</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-[7px] leading-tight max-w-32">
                      <p className="font-extrabold text-slate-400 tracking-tighter uppercase">Authorized Signature</p>
                      <p className="font-black text-slate-800 underline uppercase mt-2">M. Salim Priadi</p>
                      <p className="text-[6px] text-slate-400 font-medium">Ketua Umum Koperasi</p>
                    </div>
                  </div>
                </div>

                {/* ID-CARD BACK SIDE */}
                <div className="absolute w-full h-full rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] border border-red-650 overflow-hidden shadow-2xl bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col justify-between py-6 px-4 text-white text-center select-none">
                  <div className="text-center space-y-1">
                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] font-mono leading-none">Keamanan &amp; Verifikasi Digital</h3>
                    <p className="text-[8px] text-slate-400 font-sans tracking-wide">Pindai QR ini untuk konfirmasi status aktif pejabat</p>
                    <div className="w-12 h-[1px] bg-red-600 mx-auto my-1.5"></div>
                  </div>

                  {/* QR Core Element */}
                  <div className="my-3 flex flex-col items-center">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-750 inline-block shadow-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=991b1b&data=${encodeURIComponent(
                          `${window.location.origin}/?verify_tenant=${props.koperasiId || "kdmp"}&verify_id=${selectedIdCardContact.id}&verify_name=${encodeURIComponent(selectedIdCardContact.nama)}&verify_role=${encodeURIComponent(selectedIdCardContact.jabatanAtauPerusahaan || "Staff")}&verify_status=${selectedIdCardContact.status}`
                        )}`}
                        alt="QR ID Verifikator"
                        className="w-36 h-36 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[8px] font-mono text-red-400 font-bold tracking-widest uppercase mt-2.5">
                      QR CODE AUTH SECURE
                    </p>
                  </div>

                  {/* Operational Notes */}
                  <div className="text-left text-[7px] leading-relaxed text-slate-400 border-t border-slate-800/80 pt-2.5 space-y-1">
                    <p className="text-[8px] font-extrabold text-slate-200 mb-1 leading-none uppercase font-mono">Panduan Pengunaan</p>
                    <p>1. Kartu identitas ini merupakan tanda pengenal resmi ${props.koperasiName || "Financial System"}.</p>
                    <p>2. Pihak ketiga dipersilakan melakukan pemindaian QR Code di atas menggunakan kamera ponsel guna memvalidasi status pengurus secara real-time di database.</p>
                    <p>3. Jika profil nama / jabatan tidak terdaftar, maka kartu tersebut dinyatakan tidak sah.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="w-full grid grid-cols-2 gap-3.5 mt-2">
              <button
                type="button"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" /> Balik Kartu
              </button>
              
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/10"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak ID Card
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
