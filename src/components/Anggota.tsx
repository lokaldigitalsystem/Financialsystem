/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  Search, 
  Home, 
  Mail, 
  Phone, 
  PlusCircle, 
  CreditCard, 
  Send, 
  DollarSign, 
  AlertCircle, 
  Check, 
  Filter,
  X,
  FileDown,
  QrCode,
  Printer,
  ShieldCheck,
  Megaphone,
  RefreshCw
} from 'lucide-react';
import { Anggota, Tagihan, JurnalEntry } from '../types';

interface AnggotaProps {
  anggotaData: Anggota[];
  tagihanData: Tagihan[];
  jurnalData: JurnalEntry[];
  accessMode: "admin" | "view";
  onAddAnggota: (
    nama: string, 
    alamat: string, 
    simpananPokok: number, 
    jenisKelamin: "Laki-laki" | "Perempuan", 
    noHp: string, 
    email: string,
    tipe: "Biasa" | "Luar Biasa",
    foto?: string,
    nik?: string,
    tglLahir?: string,
    tglBergabung?: string,
    customId?: string
  ) => void;
  onUpdateAnggota: (
    id: string, 
    nama: string, 
    alamat: string, 
    simpananPokok: number, 
    jenisKelamin: "Laki-laki" | "Perempuan", 
    noHp: string, 
    email: string,
    tipe: "Biasa" | "Luar Biasa",
    foto?: string,
    nik?: string,
    tglLahir?: string,
    tglBergabung?: string
  ) => void;
  onDeleteAnggota: (id: string) => void;
  onAddTagihan: (
    anggotaId: string, 
    kategori: string, 
    jumlah: number, 
    tglTagihan: string, 
    keterangan: string
  ) => void;
  onUpdateTagihanStatus: (id: string, status: "Belum Bayar" | "Lunas") => void;
  onDeleteTagihan: (id: string) => void;
  onClearAllTagihan?: () => void;
  onClearLunasTagihan?: () => void;
  onAddJurnal?: (tgl: string, no: string, ket: string, entries: { akun: string; debet: number; kredit: number }[]) => void;
  koperasiId?: string;
  koperasiName?: string;
  koperasiLogo?: string;
}

export function AnggotaList(props: AnggotaProps) {
  // Navigation tabs: "daftar" (Daftar Anggota) or "tagihan" (Layanan Tagihan & Penagihan)
  const [activeTab, setActiveTab] = useState<"daftar" | "tagihan">("daftar");

  // State for member modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Anggota | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ID Card Viewer states for members
  const [selectedIdCardMember, setSelectedIdCardMember] = useState<Anggota | null>(null);
  const [selectedPrintBill, setSelectedPrintBill] = useState<Tagihan | null>(null);
  const [selectedBillsForBulkPrint, setSelectedBillsForBulkPrint] = useState<Tagihan[]>([]);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  // Member Form Fields
  const [formId, setFormId] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [simpanan, setSimpanan] = useState(0);
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [noHp, setNoHp] = useState("");
  const [email, setEmail] = useState("");
  const [tipe, setTipe] = useState<"Biasa" | "Luar Biasa">("Biasa");
  const [foto, setFoto] = useState("");
  const [nik, setNik] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [tglBergabung, setTglBergabung] = useState("");

  // Search Filter for members list
  const [filterQuery, setFilterQuery] = useState("");
  const [filterType, setFilterType] = useState<"Semua" | "Biasa" | "Luar Biasa">("Semua");

  // Pagination states
  const [memberPageSize, setMemberPageSize] = useState<number>(10);
  const [memberCurrentPage, setMemberCurrentPage] = useState<number>(1);

  // --- State for Invoices / Tagihan ---
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [confirmDeleteTagihanId, setConfirmDeleteTagihanId] = useState<string | null>(null);
  const [billAnggotaId, setBillAnggotaId] = useState("");
  const [billKategori, setBillKategori] = useState("Simpanan Wajib");
  const [billJumlah, setBillJumlah] = useState(10000);
  const [billTgl, setBillTgl] = useState(new Date().toISOString().split('T')[0]);
  const [billKet, setBillKet] = useState("");
  const [tagihanStatusFilter, setTagihanStatusFilter] = useState<"Semua" | "Belum Bayar" | "Lunas">("Semua");
  const [tagihanSearchQuery, setTagihanSearchQuery] = useState("");

  // Tagihan pagination states
  const [tagihanPageSize, setTagihanPageSize] = useState<number>(10);
  const [tagihanCurrentPage, setTagihanCurrentPage] = useState<number>(1);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<"all" | "lunas" | null>(null);

  // Quick Deposit State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAnggota, setDepositAnggota] = useState<Anggota | null>(null);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [depositType, setDepositType] = useState("3-3200"); // Default Simpanan Wajib
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNote, setDepositNote] = useState("");

  // Reset errors & reset pages on search
  React.useEffect(() => {
    setErrorMsg("");
  }, [isModalOpen, isBillingModalOpen]);

  React.useEffect(() => {
    setMemberCurrentPage(1);
  }, [filterQuery, filterType, memberPageSize]);

  React.useEffect(() => {
    setTagihanCurrentPage(1);
  }, [tagihanSearchQuery, tagihanStatusFilter, tagihanPageSize]);

  const handleCreateOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!nama || !alamat || simpanan < 0) {
      setErrorMsg("Mohon lengkapi seluruh formulir data anggota!");
      return;
    }

    // Clean up WhatsApp input: ensure numbers only
    const cleanedPhone = noHp.replace(/[^0-9]/g, '');
    if (cleanedPhone && !cleanedPhone.startsWith('62')) {
      setErrorMsg("Format nomor hp wajib menggunakan kode negara (Contoh: 6281234567890)");
      return;
    }

    if (editingItem) {
      props.onUpdateAnggota(editingItem.id, nama, alamat, simpanan, jenisKelamin, cleanedPhone, email, tipe, foto, nik, tglLahir, tglBergabung);
    } else {
      props.onAddAnggota(nama, alamat, simpanan, jenisKelamin, cleanedPhone, email, tipe, foto, nik, tglLahir, tglBergabung, formId);
    }

    // Reset
    setNama("");
    setAlamat("");
    setSimpanan(0);
    setJenisKelamin("Laki-laki");
    setNoHp("");
    setEmail("");
    setTipe("Biasa");
    setFoto("");
    setNik("");
    setTglLahir("");
    setTglBergabung("");
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item: Anggota) => {
    setEditingItem(item);
    setFormId(item.id);
    setNama(item.nama);
    setAlamat(item.alamat);
    setSimpanan(item.simpananPokok);
    setJenisKelamin(item.jenisKelamin || "Laki-laki");
    setNoHp(item.noHp || "628");
    setEmail(item.email || "");
    setTipe(item.tipe || "Biasa");
    setFoto(item.foto || "");
    setNik(item.nik || "");
    setTglLahir(item.tglLahir || "");
    setTglBergabung(item.tglBergabung || "");
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormId("");
    setNama("");
    setAlamat("");
    setSimpanan(0);
    setJenisKelamin("Laki-laki");
    setNoHp("");
    setEmail("");
    setTipe("Biasa");
    setFoto("");
    setNik("");
    setTglLahir("");
    setTglBergabung(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenBillingModal = () => {
    // Select first member by default if exists
    if (props.anggotaData.length > 0) {
      setBillAnggotaId(props.anggotaData[0].id);
    } else {
      setBillAnggotaId("");
    }
    setBillKategori("Simpanan Wajib");
    setBillJumlah(50000);
    setBillTgl(new Date().toISOString().split('T')[0]);
    setBillKet("");
    setIsBillingModalOpen(true);
  };

  const handleSubmitBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billAnggotaId) {
      setErrorMsg("Silakan pilih anggota desa penerima tagihan!");
      return;
    }
    if (billJumlah <= 0) {
      setErrorMsg("Jumlah nominal tagihan tidak boleh nihil!");
      return;
    }

    props.onAddTagihan(billAnggotaId, billKategori, billJumlah, billTgl, billKet);
    setIsBillingModalOpen(false);
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAnggota || depositAmount <= 0 || !props.onAddJurnal) return;

    const typeLabel = depositType === "3-3100" ? "Pokok" : (depositType === "3-3200" ? "Wajib" : "Sukarela");
    const noBukti = `DEP-${Date.now().toString().slice(-6)}`;
    const keterangan = `Setoran Simpanan ${typeLabel} - ${depositAnggota.nama} (${depositAnggota.id}) ${depositNote ? '- ' + depositNote : ''}`;

    props.onAddJurnal(
      depositDate,
      noBukti,
      keterangan,
      [
        { akun: "1-1101", debet: depositAmount, kredit: 0 }, // Debet Kas
        { akun: depositType, debet: 0, kredit: depositAmount } // Kredit Simpanan
      ]
    );

    setIsDepositModalOpen(false);
    setDepositNote("");
    setDepositAmount(50000);
  };

  // Whatsapp redirect generator link
  const handleWhatsappPenagihan = (t: Tagihan) => {
    const member = props.anggotaData.find(m => m.id === t.anggotaId);
    const phoneNumber = member?.noHp || "6281234567890";
    
    // Clean up WhatsApp string
    const textMsg = `Halo, Yth. Bapak/Ibu *${t.anggotaNama}*.

Berikut adalah informasi tagihan iuran/kewajiban dari *${props.koperasiName || "Financial System"}*:

• *ID Invoice*: ${t.id}
• *Kategori*: ${t.kategori}
• *Nominal*: Rp ${t.jumlah.toLocaleString('id-ID')}
• *Keterangan*: ${t.keterangan || 'Kontribusi berkala anggota'}
• *Tanggal Terbit*: ${t.tglTagihan}

*Status Pembayaran: BELUM BAYAR (TERTUNDA)*

Dimohon untuk segera melakukan transfer ke rekening resmi atau membayarnya secara tunai di Balai Kasir.

Jika Bapak/Ibu sudah melakukan pembayaran, silakan tunjukkan tanda bukti setor sebagai verifikasi untuk kami ubah statusnya menjadi lunas.

Terima kasih atas kerja samanya. Hormat kami, Pengurus ${props.koperasiName || "Financial System"}.`;

    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  };

  // Mailto client link generator
  const handleEmailPenagihan = (t: Tagihan) => {
    const member = props.anggotaData.find(m => m.id === t.anggotaId);
    const destinationEmail = member?.email || "anggota@koperasi.id";
    const subject = `[Pemberitahuan Tagihan Koperasi] - Invois ${t.id} - ${t.anggotaNama}`;
    const emailBody = `Yth. Bapak/Ibu ${t.anggotaNama},

Harap diperhatikan bahwa akun keanggotaan Anda memiliki tagihan tertunda yang memerlukan penyelesaian.

Detail Tagihan Keanggotaan:
- ID Tagihan: ${t.id}
- Kategori Kewajiban: ${t.kategori}
- Jumlah Tagihan: Rp ${t.jumlah.toLocaleString('id-ID')}
- Tanggal Informasi: ${t.tglTagihan}
- Deskripsi: ${t.keterangan || 'Tagihan periodik wajib anggota'}

Pernyataan Status: BELUM MEMBAYAR (TERTUNDA)

Anda dapat melakukan pembayaran via loket tunai koperasi semenjak pemberitahuan ini diterima, menggunakan Kas Tunai ataupun transfer dana bank terdaftar.

Hormat kami,
Staf Verifikasi & Keuangan ${props.koperasiName || "Financial System"}`;

    const mailtoUrl = `mailto:${destinationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  // Members lists filters
  const filteredAnggota = props.anggotaData.filter(a => {
    if (filterType !== "Semua") {
      const actualType = a.tipe || "Biasa";
      if (actualType !== filterType) return false;
    }

    const q = filterQuery.toLowerCase();
    const matchesQuery = a.nama.toLowerCase().includes(q) || 
                         a.alamat.toLowerCase().includes(q) || 
                         a.id.toLowerCase().includes(q) ||
                         (a.noHp && a.noHp.includes(q)) ||
                         (a.email && a.email.toLowerCase().includes(q));
    return matchesQuery;
  });

  // Calculate gender statistics
  const totalLakiLaki = props.anggotaData.filter(a => a.jenisKelamin === "Laki-laki").length;
  const totalPerempuan = props.anggotaData.filter(a => a.jenisKelamin === "Perempuan").length;

  // Billing lists filters & statistics
  const billsList = props.tagihanData || [];
  const totalTagihanAmount = billsList.reduce((acc, curr) => acc + curr.jumlah, 0);
  
  const unpaidBills = billsList.filter(t => t.status === "Belum Bayar");
  const totalUnpaidAmount = unpaidBills.reduce((acc, curr) => acc + curr.jumlah, 0);
  
  const paidBills = billsList.filter(t => t.status === "Lunas");
  const totalPaidAmount = paidBills.reduce((acc, curr) => acc + curr.jumlah, 0);

  const filteredBills = billsList.filter(t => {
    // Status Filter
    if (tagihanStatusFilter !== "Semua" && t.status !== tagihanStatusFilter) {
      return false;
    }
    // Search filter queries
    const q = tagihanSearchQuery.toLowerCase();
    if (!q) return true;
    return t.anggotaNama.toLowerCase().includes(q) || 
           t.id.toLowerCase().includes(q) || 
           t.kategori.toLowerCase().includes(q) || 
           t.keterangan.toLowerCase().includes(q);
  });

  const memberTotalPages = Math.ceil(filteredAnggota.length / memberPageSize) || 1;
  const safeMemberCurrentPage = Math.min(memberCurrentPage, memberTotalPages);
  const memberStartIndex = (safeMemberCurrentPage - 1) * memberPageSize;
  const paginatedAnggota = filteredAnggota.slice(memberStartIndex, memberStartIndex + memberPageSize);

  const tagihanTotalPages = Math.ceil(filteredBills.length / tagihanPageSize) || 1;
  const safeTagihanCurrentPage = Math.min(tagihanCurrentPage, tagihanTotalPages);
  const tagihanStartIndex = (safeTagihanCurrentPage - 1) * tagihanPageSize;
  const paginatedBills = filteredBills.slice(tagihanStartIndex, tagihanStartIndex + tagihanPageSize);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "daftar") {
      csvContent += "Daftar Anggota - Cloud Ledger System\r\n";
      csvContent += "ID Kepesertaan,Nama Lengkap,Jenis Kelamin,Alamat,No WhatsApp,Email,Nilai Saldo (Rp)\r\n";
      
      filteredAnggota.forEach(a => {
        const row = [
          `"${a.id}"`,
          `"${a.nama.replace(/"/g, '""')}"`,
          `"${a.jenisKelamin}"`,
          `"${a.alamat.replace(/"/g, '""')}"`,
          `"${a.noHp}"`,
          `"${a.email}"`,
          a.simpananPokok.toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "Log Tagihan / Faktur Transaksi Pelanggan\r\n";
      csvContent += "ID Invoice,Nama Penerima,ID Entitas,Kategori,Tanggal Tagihan,Keterangan,Jumlah (Rp),Status Pembayaran\r\n";
      
      filteredBills.forEach(bill => {
        const row = [
          `"${bill.id}"`,
          `"${bill.anggotaNama.replace(/"/g, '""')}"`,
          `"${bill.anggotaId}"`,
          `"${bill.kategori}"`,
          `"${bill.tglTagihan}"`,
          `"${(bill.keterangan || '').replace(/"/g, '""')}"`,
          bill.jumlah.toString(),
          `"${bill.status}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ANGGOTA_${activeTab.toUpperCase()}_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateAge = (birthday?: string) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return null;
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div id="anggota-keanggotaan-screen">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-red-600" /> Database Keanggotaan Warga
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pengelolaan database terpadu profil warga desa dan layanan penagihan iuran kontribusi
          </p>
        </div>
        <button
          id="export-anggota-csv-btn"
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer self-start md:self-auto"
          title="Download membership list / invoices as CSV file"
        >
          <FileDown className="h-4 w-4" /> Export CSV (Excel)
        </button>
      </div>

      {/* COMPACT SUBMENU TABS */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          id="tab-btn-daftar"
          onClick={() => setActiveTab("daftar")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "daftar"
              ? "border-red-650 text-red-650"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" /> Daftar Kepesertaan Anggota Desa
        </button>
        <button
          id="tab-btn-tagihan"
          onClick={() => setActiveTab("tagihan")}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "tagihan"
              ? "border-red-650 text-red-650"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Tagihan & Layanan Penagihan ({unpaidBills.length})
        </button>
      </div>

      {/* TAB CONTAINER 1: DAFTAR ANGGOTA */}
      {activeTab === "daftar" && (
        <div className="space-y-6">
          {/* CONTROL BAR */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="search-anggota"
                  type="text"
                  placeholder="Cari nama, alamat dusun, nomor WA, email..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 bg-slate-50 rounded focus:outline-none focus:border-red-500"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Filter Tipe:</span>
                <select
                  id="filter-type-select"
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="Semua">Semua Keanggotaan</option>
                  <option value="Biasa">Anggota Biasa (Warga)</option>
                  <option value="Luar Biasa">Anggota Luar Biasa</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs text-gray-500 select-none flex flex-wrap items-center gap-2">
                <span>Total Terdaftar: <span className="font-bold text-gray-900">{props.anggotaData.length}</span> Orang</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase select-none">
                  ♂ Laki-laki: {totalLakiLaki}
                </span>
                <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase select-none">
                  ♀ Perempuan: {totalPerempuan}
                </span>
              </div>
              {props.accessMode === "admin" && (
                <button
                  id="btn-registrasi-anggota"
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" /> Registrasi Anggota Baru
                </button>
              )}
            </div>
          </div>

          {/* MEMBERS TABLE */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-red-600 text-white text-xs font-semibold">
                    <th className="py-3 px-4">ID Kepesertaan</th>
                    <th className="py-3 px-4">Nama Anggota</th>
                    <th className="py-3 px-4 text-center">Jenis Kelamin</th>
                    <th className="py-3 px-4"><div className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" /> Dusun / Alamat KTP</div></th>
                    <th className="py-3 px-4 text-center">Kontak WhatsApp / Email</th>
                    <th className="py-3 px-4 text-right">Total Simpanan</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {paginatedAnggota.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                        Tidak ada anggota desa yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    paginatedAnggota.map(item => {
                      const savingsCodes = ["3-3000", "3-3100", "3-3200", "3-3300"];
                      const memberBalance = (props.jurnalData || [])
                        .filter(j => 
                          j.ket.includes(`(${item.id})`) && 
                          savingsCodes.some(code => j.akun.startsWith(code))
                        )
                        .reduce((sum, j) => sum + (j.kredit - j.debet), 0);
                      
                      return (
                        <tr key={item.id} className="hover:bg-red-50/10 transition-colors">
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-gray-800">{item.id}</div>
                            {item.nik && <div className="text-[9px] text-gray-400">NIK: {item.nik}</div>}
                          </td>
                          <td className="py-3.5 px-4 animate-in fade-in duration-200">
                            <div className="font-bold text-gray-900">{item.nama}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                item.tipe === "Luar Biasa"
                                  ? "bg-amber-150 text-amber-850 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                Anggota {item.tipe || "Biasa"}
                              </span>
                              {item.tglLahir && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  {calculateAge(item.tglLahir)} Thn
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              item.jenisKelamin === 'Perempuan' 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}>
                              {item.jenisKelamin || "Laki-laki"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-gray-600">
                            {item.alamat}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {item.noHp ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700">
                                  <Phone className="h-3 w-3 text-emerald-500" /> {item.noHp}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No HP n/a</span>
                              )}
                              {item.email ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                                  <Mail className="h-2.5 w-2.5 text-gray-400" /> {item.email}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Email n/a</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                            <span className={memberBalance > 0 ? "text-emerald-600" : "text-gray-400"}>
                              Rp {memberBalance.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex gap-1.5 justify-center items-center">
                              {/* History trigger button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIdCardMember(item);
                                }}
                                className="inline-flex items-center gap-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-black uppercase rounded cursor-pointer transition"
                                title="Lihat Riwayat Tabungan/Simpanan"
                              >
                                <RefreshCw className="h-3.5 w-3.5 text-slate-600" /> Riwayat
                              </button>
  
                              {props.accessMode === "admin" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDepositAnggota(item);
                                    setDepositType("3-3300"); // Default to Sukarela for this button
                                    setIsDepositModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition shadow-sm"
                                  title="Proses Setoran Simpanan Sukarela (Tabungan)"
                                >
                                  <DollarSign className="h-3.5 w-3.5" /> Setor Sukarela
                                </button>
                              )}
  
                              {props.accessMode === "admin" && (
                                <>
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-1 text-sky-650 hover:text-sky-850 hover:bg-sky-50 rounded transition cursor-pointer"
                                    title="Edit Profil Lengkap"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    className="p-1 text-rose-600 hover:text-rose-850 hover:bg-rose-55/10 rounded transition cursor-pointer"
                                    title="Hapus Dari Anggota"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  id="member-page-size-select"
                  value={memberPageSize}
                  onChange={(e) => {
                    setMemberPageSize(Number(e.target.value));
                    setMemberCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-700 bg-white cursor-pointer font-medium"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>
                  Menampilkan {filteredAnggota.length > 0 ? memberStartIndex + 1 : 0}-{Math.min(memberStartIndex + memberPageSize, filteredAnggota.length)} dari {filteredAnggota.length} anggota
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="member-prev-btn"
                  disabled={safeMemberCurrentPage === 1}
                  onClick={() => setMemberCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition select-none font-semibold"
                >
                  Sebelumnya
                </button>
                <span className="px-2 select-none">
                  Halaman <strong>{safeMemberCurrentPage}</strong> dari <strong>{memberTotalPages}</strong>
                </span>
                <button
                  id="member-next-btn"
                  disabled={safeMemberCurrentPage === memberTotalPages}
                  onClick={() => setMemberCurrentPage(prev => Math.min(prev + 1, memberTotalPages))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition select-none font-semibold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTAINER 2: LAYANAN TAGIHAN & PENAGIHAN */}
      {activeTab === "tagihan" && (
        <div className="space-y-6">
          {/* BILLING SUMMARY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-xs flex items-center gap-4" style={{ borderColor: '#d9d9fa' }}>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                <CreditCard className="h-6 w-6" style={{ borderColor: '#0421a3' }} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#0421a3' }}>Total Tagihan Terbit</div>
                <div className="text-xl font-black font-mono" style={{ color: '#0421a3' }}>Rp {totalTagihanAmount.toLocaleString('id-ID')}</div>
                <div className="text-[11px] font-medium" style={{ color: '#0421a3' }}>{billsList.length} Invoice diterbitkan</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Belum Terbayar (Tertunda)</div>
                <div className="text-xl font-black text-red-600 font-mono">Rp {totalUnpaidAmount.toLocaleString('id-ID')}</div>
                <div className="text-[11px] text-red-500 font-bold">{unpaidBills.length} Tagihan menanti pembayaran</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Lunas Terverifikasi</div>
                <div className="text-xl font-black text-emerald-600 font-mono">Rp {totalPaidAmount.toLocaleString('id-ID')}</div>
                <div className="text-[11px] text-emerald-600 font-semibold">{paidBills.length} Bill berhasil diselesaikan</div>
              </div>
            </div>
          </div>

          {/* FILTER & OPTION CONTROLS */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="search-tagihan"
                  type="text"
                  placeholder="Cari penerima, subyek, keterangan..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={tagihanSearchQuery}
                  onChange={(e) => setTagihanSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filter Status:</span>
                <select
                  id="filter-status-tagihan"
                  value={tagihanStatusFilter}
                  onChange={(e: any) => setTagihanStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="Semua">Semua Tagihan</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>

            {props.accessMode === "admin" && (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {showPurgeConfirm ? (
                  <div className="bg-red-50 border border-red-200 text-red-650 text-xs py-1.5 px-3 rounded flex items-center gap-2 animate-pulse font-medium">
                    <span>Hapus {showPurgeConfirm === "all" ? "semua" : "yang lunas"} log tagihan?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (showPurgeConfirm === "all" && props.onClearAllTagihan) {
                          props.onClearAllTagihan();
                        } else if (showPurgeConfirm === "lunas" && props.onClearLunasTagihan) {
                          props.onClearLunasTagihan();
                        }
                        setShowPurgeConfirm(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer transition"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPurgeConfirm(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-2 py-0.5 rounded text-[10px] cursor-pointer transition"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="btn-hapus-log-lunas"
                      title="Hapus / bersihkan log tagihan lunas dari tabel"
                      disabled={paidBills.length === 0}
                      onClick={() => setShowPurgeConfirm("lunas")}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-705 font-bold text-xs rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-500" /> Hapus Log Lunas
                    </button>

                    <button
                      id="btn-hapus-semua-log"
                      title="Hapus seluruh log tagihan secara massal"
                      disabled={billsList.length === 0}
                      onClick={() => setShowPurgeConfirm("all")}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-red-150 hover:bg-red-50 text-red-700 font-bold text-xs rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" /> Hapus Semua Log
                    </button>

                    <button
                      id="btn-buat-tagihan"
                      onClick={handleOpenBillingModal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" /> Buat Tagihan Baru
                    </button>
                    {bulkSelection.length > 0 && (
                      <button
                        onClick={() => {
                          const selected = props.tagihanData.filter(t => bulkSelection.includes(t.id));
                          setSelectedBillsForBulkPrint(selected);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5 cursor-pointer animate-in zoom-in-95"
                      >
                        <Printer className="h-4 w-4" /> Cetak Terpilih ({bulkSelection.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AUTOMATION CONTROLS PANEL */}
          {props.accessMode === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <RefreshCw className="h-5 w-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-tight">Automated Monthly Billing</h4>
                    <p className="text-[10px] text-indigo-700 font-medium leading-none">Generasi tagihan Simpanan Wajib massal harian/bulanan.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/trigger-member-billing', { method: 'POST' });
                      if(res.ok) alert("Proses automasi billing anggota berhasil dijalankan!");
                    } catch (e) {
                      alert("Gagal menghubungi server automasi.");
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-200 transition shadow-sm cursor-pointer"
                >
                  Trigger Manual
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-tight">Bulk Unpaid Reminder</h4>
                    <p className="text-[10px] text-amber-700 font-medium leading-none">Kirim pengingat email/notifikasi ke {unpaidBills.length} anggota.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={unpaidBills.length === 0}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/member/bulk-notify-unpaid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          koperasiId: props.koperasiId || "local",
                          bills: unpaidBills.map(b => b.id)
                        })
                      });
                      if(res.ok) alert(`Pemberitahuan massal terkirim ke ${unpaidBills.length} anggota!`);
                    } catch (e) {
                      alert("Gagal menghubungi server automasi.");
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-200 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Pengingat Massal
                </button>
              </div>
            </div>
          )}

          {/* BILLING AND NOTIFICATION ACTIONS TABLE */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs font-semibold">
                    <th className="py-3 px-4 w-10">
                      <input 
                        type="checkbox"
                        className="rounded border-gray-300 text-red-600 h-3.5 w-3.5 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelection(paginatedBills.map(b => b.id));
                          } else {
                            setBulkSelection([]);
                          }
                        }}
                        checked={bulkSelection.length > 0 && bulkSelection.length === paginatedBills.length}
                      />
                    </th>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Anggota Penerima</th>
                    <th className="py-3 px-4">Kategori & Tanggal</th>
                    <th className="py-3 px-4">Keterangan Tagihan</th>
                    <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Garis Layanan Penagihan</th>
                    {props.accessMode === "admin" && <th className="py-3 px-4 text-center">Tindakan</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-750">
                  {paginatedBills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                        Tidak ada berkas invoice / tagihan yang terdata.
                      </td>
                    </tr>
                  ) : (
                    paginatedBills.map(bill => {
                      const relatedMember = props.anggotaData.find(m => m.id === bill.anggotaId);
                      
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <input 
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 h-3.5 w-3.5 cursor-pointer"
                              checked={bulkSelection.includes(bill.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSelection([...bulkSelection, bill.id]);
                                } else {
                                  setBulkSelection(bulkSelection.filter(id => id !== bill.id));
                                }
                              }}
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                            {bill.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{bill.anggotaNama}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {bill.anggotaId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10.5px]">
                              {bill.kategori}
                            </span>
                            <div className="text-[10.5px] text-gray-500 mt-1">{bill.tglTagihan}</div>
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate" title={bill.keterangan}>
                            {bill.keterangan || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono text-sm">
                            Rp {bill.jumlah.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded ${
                              bill.status === "Lunas" 
                                ? "bg-emerald-100 text-emerald-850" 
                                : "bg-red-150 text-red-750"
                            }`}>
                              {bill.status === "Lunas" ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {/* SEND BUTTONS */}
                            <div className="inline-flex gap-2 justify-center items-center">
                              {bill.status === 'Belum Bayar' ? (
                                <>
                                  <button
                                    onClick={() => handleWhatsappPenagihan(bill)}
                                    className="inline-flex items-center gap-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded border border-emerald-500 shadow-xs cursor-pointer transition hover:scale-[1.02] active:scale-95"
                                    title="Kirim Pemberitahuan Invoice via Akun WhatsApp"
                                  >
                                    <Phone className="h-3.5 w-3.5" /> WA Bill
                                  </button>
                                  <button
                                    onClick={() => handleEmailPenagihan(bill)}
                                    className="inline-flex items-center gap-1 py-1.5 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10.5px] rounded border border-sky-500 shadow-xs cursor-pointer transition hover:scale-[1.02] active:scale-95"
                                    title="Kirim Notifikasi Rincian via Surel Instan"
                                  >
                                    <Mail className="h-3.5 w-3.5" /> Email
                                  </button>
                                  <button
                                    onClick={() => setSelectedPrintBill(bill)}
                                    className="inline-flex items-center gap-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] rounded border border-slate-200 shadow-xs cursor-pointer transition"
                                    title="Cetak Lembar Tagihan / Invoice Resmi"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> Cetak
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 rounded px-2 py-1 flex items-center gap-1">
                                  <Check className="h-3 w-3 text-emerald-600 font-bold" /> Pembayaran Selesai
                                </span>
                              )}
                            </div>
                          </td>
                          {props.accessMode === "admin" && (
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col gap-1.5 justify-center items-center">
                                {/* Mark paid / unpaid toggler */}
                                {bill.status === "Belum Bayar" ? (
                                  <button
                                    onClick={() => props.onUpdateTagihanStatus(bill.id, "Lunas")}
                                    className="w-full max-w-[100px] py-1 bg-teal-55/90 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-black rounded cursor-pointer transition"
                                  >
                                    Set Lunas
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => props.onUpdateTagihanStatus(bill.id, "Belum Bayar")}
                                    className="w-full max-w-[100px] py-1 bg-amber-55/95 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black rounded cursor-pointer transition"
                                  >
                                    Belum Lunas
                                  </button>
                                )}

                                {confirmDeleteTagihanId === bill.id ? (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                                    <span className="text-[8px] font-bold text-red-600 uppercase">Hapus Tagihan?</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteTagihanId(bill.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Hapus Tagihan Ini"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
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

            {/* Pagination Controls Footer for Invoices */}
            <div className="bg-slate-50 px-4 py-3 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  id="tagihan-page-size-select"
                  value={tagihanPageSize}
                  onChange={(e) => {
                    setTagihanPageSize(Number(e.target.value));
                    setTagihanCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-700 bg-white cursor-pointer font-medium"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>
                  Menampilkan {filteredBills.length > 0 ? tagihanStartIndex + 1 : 0}-{Math.min(tagihanStartIndex + tagihanPageSize, filteredBills.length)} dari {filteredBills.length} tagihan
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="tagihan-prev-btn"
                  disabled={safeTagihanCurrentPage === 1}
                  onClick={() => setTagihanCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition select-none font-semibold"
                >
                  Sebelumnya
                </button>
                <span className="px-2 select-none">
                  Halaman <strong>{safeTagihanCurrentPage}</strong> dari <strong>{tagihanTotalPages}</strong>
                </span>
                <button
                  id="tagihan-next-btn"
                  disabled={safeTagihanCurrentPage === tagihanTotalPages}
                  onClick={() => setTagihanCurrentPage(prev => Math.min(prev + 1, tagihanTotalPages))}
                  className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition select-none font-semibold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG ADD/EDIT MEMBER POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingItem ? "Ubah Data Profil Warga" : "Registrasi Anggota Desa Baru"}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setNama("");
                  setAlamat("");
                  setSimpanan(0);
                  setJenisKelamin("Laki-laki");
                  setNoHp("");
                }}
                className="text-white hover:text-white/80 font-bold text-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrEdit} className="p-6 text-left space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold rounded-lg leading-relaxed animate-shake">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ID Anggota (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk otomatis..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 font-mono font-bold text-red-600"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Lengkap Warga (KTP)</label>
                  <input
                    id="form-member-name"
                    type="text"
                    required
                    placeholder="Masukkan nama sesuai KTP"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850 font-semibold"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">NIK (16 Digit KTP)</label>
                  <input
                    id="form-member-nik"
                    type="text"
                    placeholder="Contoh: 3201xxxxxxxxxxxx"
                    maxLength={16}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 font-mono text-gray-850"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Jenis Kelamin</label>
                  <select
                    id="form-member-gender"
                    required
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850 font-medium"
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value as any)}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanggal Lahir</label>
                  <input
                    id="form-member-birthdate"
                    type="date"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850"
                    value={tglLahir}
                    onChange={(e) => setTglLahir(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Wilayah Alamat Dusun</label>
                  <input
                    id="form-member-address"
                    type="text"
                    required
                    placeholder="Contoh: Dusun Jomin 01, RT 02/01"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nomor WhatsApp (62)</label>
                  <input
                    id="form-member-phone"
                    type="text"
                    required
                    placeholder="Format: 6281xxxxxxxxx"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 font-mono text-gray-850"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Surat Elektronik (Email)</label>
                  <input
                    id="form-member-email"
                    type="email"
                    placeholder="warga@desa.id"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanggal Bergabung</label>
                  <input
                    id="form-member-joined"
                    type="date"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850"
                    value={tglBergabung}
                    onChange={(e) => setTglBergabung(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipe/Klasifikasi Anggota</label>
                  <select
                    id="form-member-type"
                    required
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 text-gray-850 font-bold"
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as "Biasa" | "Luar Biasa")}
                  >
                    <option value="Biasa">Anggota Biasa (Penduduk Desa)</option>
                    <option value="Luar Biasa">Anggota Luar Biasa (Mitra / Luar Desa)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Setoran Pokok Awal (Rp)</label>
                  <input
                    id="form-member-deposit"
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 250000"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 font-bold font-mono text-gray-850"
                    value={simpanan}
                    onChange={(e) => setSimpanan(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-xs text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-lg transition font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="submit-member-btn"
                  type="submit"
                  className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition transform active:scale-95 cursor-pointer"
                >
                  {editingItem ? "Update Profil" : "Registrasi"}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* DELETE TAGIHAN CONFIRMATION MODAL - Upgraded from inline for professional touch */}
      {confirmDeleteTagihanId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Konfirmasi Hapus Tagihan</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 px-2">
                Apakah Anda yakin ingin menghapus catatan tagihan untuk <span className="font-bold text-red-600">
                  {props.tagihanData.find(t => t.id === confirmDeleteTagihanId)?.anggotaNama}
                </span>? Tindakan ini akan menghapus bukti piutang selamanya.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTagihanId(null)}
                  className="flex-1 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteTagihanId) {
                      props.onDeleteTagihan(confirmDeleteTagihanId);
                      setConfirmDeleteTagihanId(null);
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MEMBER CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Konfirmasi Hapus Anggota</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus data anggota <span className="font-bold text-red-600">{props.anggotaData.find(a => a.id === confirmDeleteId)?.nama}</span>? 
                Seluruh riwayat tagihan dan profil akan dihapus secara permanen dari basis data.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 text-xs text-gray-500 font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteId) {
                      props.onDeleteAnggota(confirmDeleteId);
                      setConfirmDeleteId(null);
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 cursor-pointer"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK DEPOSIT MODAL */}
      {isDepositModalOpen && depositAnggota && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 px-5 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-left">Setoran Tunai Simpanan</h3>
                  <p className="text-[10px] text-emerald-100 uppercase font-black tracking-wider text-left">Input Jurnal Otomatis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="text-white hover:text-emerald-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitDeposit} className="p-6 space-y-4 text-left">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  {depositAnggota.nama[0]}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none mb-1">Anggota Penabung</p>
                  <p className="text-sm font-black text-slate-800 leading-tight">{depositAnggota.nama}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jenis Simpanan</label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                    value={depositType}
                    onChange={(e) => setDepositType(e.target.value)}
                  >
                    <option value="3-3200">Simpanan Wajib (Rutin)</option>
                    <option value="3-3100">Simpanan Pokok (Bergabung)</option>
                    <option value="3-3300">Simpanan Sukarela (Tabungan)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jumlah Setoran (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-black font-mono text-slate-800"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal Setor</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-700"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Setoran bulan Juni 2024"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-700"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="flex-1 py-3 text-xs text-gray-500 font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 transition active:scale-95 cursor-pointer"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG ADD/CREATE BILLING INVOICE POPUP */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-slate-800 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                Peluncuran Tagihan Baru
              </h3>
              <button 
                onClick={() => setIsBillingModalOpen(false)}
                className="text-white hover:text-gray-300 font-bold text-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitBilling} className="p-5 space-y-3">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold rounded-lg leading-relaxed animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* ANGGOTA SELECTOR */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Anggota Penerima Tagihan</label>
                <select
                  id="form-bill-member"
                  required
                  value={billAnggotaId}
                  onChange={(e) => setBillAnggotaId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-850 font-medium cursor-pointer"
                >
                  {props.anggotaData.length === 0 ? (
                    <option value="">Belum ada anggota terdaftar</option>
                  ) : (
                    props.anggotaData.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id} - {m.nama} ({m.alamat.split(',')[0]})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* KATEGORI SELECTOR */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Kategori Tagihan</label>
                <select
                  id="form-bill-category"
                  required
                  value={billKategori}
                  onChange={(e) => setBillKategori(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-850 cursor-pointer"
                >
                  <option value="Simpanan Wajib">Simpanan Wajib</option>
                  <option value="Iuran Bulanan">Iuran Bulanan</option>
                  <option value="Tagihan Pupuk / Barang">Tagihan Pupuk / Barang</option>
                  <option value="Jasa Finansial">Jasa Finansial</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              {/* NOMINAL JUMLAH INVOICE */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nominal Tagihan (Rp)</label>
                <input
                  id="form-bill-amount"
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="50000"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-bold font-mono text-gray-850"
                  value={billJumlah}
                  onChange={(e) => setBillJumlah(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              {/* TANGGAL TERBIT */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tanggal Terbit Tagihan</label>
                <input
                  id="form-bill-date"
                  type="date"
                  required
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-850"
                  value={billTgl}
                  onChange={(e) => setBillTgl(e.target.value)}
                />
              </div>

              {/* KETERANGAN */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pesan Keterangan Khusus</label>
                <textarea
                  id="form-bill-info"
                  placeholder="Contoh: Pembelian bibit padi dan kontribusi kas desa wajib bulanan"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 text-gray-850 h-20 resize-none font-medium"
                  value={billKet}
                  onChange={(e) => setBillKet(e.target.value)}
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded transition font-medium text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="submit-bill-btn"
                  type="submit"
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded shadow transition text-center cursor-pointer"
                >
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL PRINT MODAL (SINGLE OR BULK) */}
      {(selectedPrintBill || selectedBillsForBulkPrint.length > 0) && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="w-full flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {selectedPrintBill ? "Preview Lembar Tagihan" : `Preview Cetak Massal (${selectedBillsForBulkPrint.length})`}
              </h3>
              <button 
                onClick={() => {
                  setSelectedPrintBill(null);
                  setSelectedBillsForBulkPrint([]);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * { visibility: hidden; }
                #print-area-wrapper, #print-area-wrapper * { visibility: visible; }
                #print-area-wrapper {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .bill-page {
                  page-break-after: always;
                  height: 100vh;
                  padding: 40px;
                  box-sizing: border-box;
                }
                .bill-card-print {
                  border: 2px dashed #e2e8f0 !important;
                  padding: 30px !important;
                }
              }
            `}} />

            <div className="w-full max-h-[60vh] overflow-y-auto mb-4 p-2 space-y-4">
              <div id="print-area-wrapper" className="w-full">
                {(selectedPrintBill ? [selectedPrintBill] : selectedBillsForBulkPrint).map((bill, idx) => (
                  <div key={bill.id} className={`bill-page ${idx > 0 ? "mt-8 no-print" : ""}`}>
                    <div className="bill-card-print bg-white w-full border border-slate-100 p-6 rounded-xl shadow-sm text-left text-slate-900 border-dashed relative overflow-hidden">
                      {/* Watermark for Unpaid */}
                      {bill.status !== "Lunas" && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 opacity-[0.03] select-none pointer-events-none">
                          <span className="text-8xl font-black whitespace-nowrap">BELUM BAYAR</span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-3 border-b-2 border-red-600 pb-3 mb-4">
                        <div className="h-10 w-10 bg-red-600 rounded flex items-center justify-center text-white shrink-0 font-black text-lg">K</div>
                        <div className="min-w-0">
                          <h1 className="text-xs font-black text-red-600 uppercase tracking-tight truncate leading-tight">
                            {props.koperasiName || "Financial System"}
                          </h1>
                          <p className="text-[9px] text-slate-400 font-medium leading-tight">Sistem Administrasi Koperasi & Keuangan</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="bg-slate-50 text-center py-1 rounded border border-slate-100 mb-4 flex justify-center items-center gap-2">
                        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">LEMBAR TAGIHAN / INVOICE RESMI</span>
                        {bill.status === "Lunas" && (
                          <span className="bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">LUNAS</span>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-400 font-bold uppercase text-[8px]">ID Invoice</span>
                          <span className="font-mono font-bold">{bill.id}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-400 font-bold uppercase text-[8px]">Diterbitkan Untuk</span>
                           <div className="text-right">
                            <div className="font-bold">{bill.anggotaNama}</div>
                            <div className="text-[8px] text-slate-400 font-mono">ID Member: {bill.anggotaId}</div>
                          </div>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-400 font-bold uppercase text-[8px]">Tanggal Terbit</span>
                          <span className="font-medium">{bill.tglTagihan}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-400 font-bold uppercase text-[8px]">Kategori Pembayaran</span>
                          <span className="font-bold text-red-600">{bill.kategori}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-4 p-3 bg-slate-50/50 rounded-lg border border-slate-100 min-h-[60px]">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Rincian Tagihan:</span>
                        <p className="text-[10px] leading-relaxed italic text-slate-700">{bill.keterangan || "Tagihan rutin bulanan/iuran wajib keanggotaan."}</p>
                      </div>

                      {/* Amount Section */}
                      <div className="mt-4 flex justify-between items-center py-2.5 border-t-2 border-slate-100">
                        <span className="text-[11px] font-black text-slate-900 uppercase">Jumlah Harus Dibayarkan:</span>
                        <span className="text-xl font-black text-red-600 font-mono">Rp{bill.jumlah.toLocaleString('id-ID')}</span>
                      </div>

                      {/* Bottom Info (QR + Signature) */}
                      <div className="mt-6 flex gap-4 items-end">
                        {/* QR Placeholder */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-16 w-16 border-2 border-slate-200 rounded-lg p-1 bg-white flex items-center justify-center text-slate-300">
                            <QrCode className="h-12 w-12" strokeWidth={1} />
                          </div>
                          <span className="text-[6px] font-mono text-gray-400 uppercase">Verifikasi Sistem</span>
                        </div>

                        {/* Payment Instructions */}
                        <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-lg p-2">
                          <span className="text-[7px] font-black text-blue-900 uppercase mb-1 block underline decoration-blue-200">Metode Pembayaran:</span>
                          <div className="text-[8px] text-blue-800 space-y-0.5 font-medium">
                            <p>• Transfer: Bank BNI - 0123456789</p>
                            <p>• Atas Nama: Koperasi Berdikari Utama</p>
                            <p>• Atau Bayar Tunai di Kantor Kasir</p>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="w-1/3 text-center text-[8px]">
                          <p className="text-slate-400 uppercase font-black mb-10">Bendehara Koperasi,</p>
                          <div className="border-t border-slate-200 pt-1 font-bold font-mono text-slate-800">( Petugas Keuangan )</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center text-[7px] text-slate-300 font-mono italic">
                        Dicetak secara otomatis oleh {props.koperasiName} SaaS Portal pada {new Date().toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                window.print();
                if (selectedBillsForBulkPrint.length > 0) {
                  setBulkSelection([]);
                  setSelectedBillsForBulkPrint([]);
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" /> 
              {selectedPrintBill ? "Cetak Lembar Sekarang" : "Cetak Massal Sekarang"}
            </button>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL & QR-ID CARD PREVIEW MODAL */}
      {selectedIdCardMember && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 no-print animate-in fade-in duration-200">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-150 max-h-[95vh] overflow-hidden">
            
            {/* Modal Header Controls */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">Detail Keanggotaan Terverifikasi</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Dikelola oleh Database Digital {props.koperasiName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedIdCardMember(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-tabs for Detail View */}
            <div className="flex w-full bg-slate-950/50 p-1 rounded-xl mb-6 border border-slate-800 shrink-0">
              <div className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-800 text-white shadow-sm text-center">
                Riwayat Simpanan & Tabungan
              </div>
            </div>

            {(() => {
              // We just show Riwayat Simpanan directly now
              return (
                <div className="w-full flex-1 overflow-y-auto custom-scrollbar px-2">
                <div className="text-left mb-4">
                  <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Riwayat Setoran Simpanan</h4>
                  <p className="text-slate-400 text-[10px]">Data histori ditarik otomatis dari buku jurnal umum anggota <strong>{selectedIdCardMember.nama}</strong></p>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-900 text-slate-500 font-black uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3 italic">Referensi/Ket</th>
                        <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(() => {
                        const savingsCodes = ["3-3000", "3-3100", "3-3200", "3-3300"]; // COA codes related to member savings
                        const memberHistory = (props.jurnalData || []).filter(j => 
                          (j.ket.toLowerCase().includes(selectedIdCardMember.nama.toLowerCase()) || 
                           j.ket.toLowerCase().includes(selectedIdCardMember.id.toLowerCase())) &&
                          savingsCodes.some(code => j.akun.startsWith(code) || j.ket.toLowerCase().includes("simpanan"))
                        );

                        const totalSimpanan = memberHistory.reduce((sum, j) => sum + (j.kredit || j.debet), 0);

                        if (memberHistory.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="py-12 text-center text-slate-600 font-medium italic">
                                Belum ada record simpanan di buku jurnal desa.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {memberHistory.map(j => (
                              <tr key={j.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="py-3 px-3 text-slate-300 font-mono">{j.tgl}</td>
                                <td className="py-3 px-3">
                                  <p className="text-slate-200 font-bold leading-tight">{j.ket}</p>
                                  <p className="text-slate-500 text-[8px] mt-0.5 uppercase tracking-tighter">REF: {j.no}</p>
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-400 font-black font-mono">
                                  + Rp {(j.kredit || j.debet).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                            {/* Calculation Row for better summary inside table */}
                            <tr className="bg-emerald-500/5">
                              <td colSpan={2} className="py-3 px-3 text-right text-[9px] font-black text-emerald-500 uppercase tracking-widest">Akumulasi Saldo Tabungan</td>
                              <td className="py-3 px-3 text-right text-emerald-400 font-black font-mono border-l border-emerald-500/20">
                                Rp {totalSimpanan.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Additional Summary Info */}
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest leading-none mb-1">Total Simpanan Terverifikasi</p>
                    <p className="text-emerald-400 text-lg font-black font-mono">
                      Rp {(() => {
                        const savingsCodes = ["3-3000", "3-3100", "3-3200", "3-3300"];
                        const memberHistory = (props.jurnalData || []).filter(j => 
                          (j.ket.toLowerCase().includes(selectedIdCardMember.nama.toLowerCase()) || 
                           j.ket.toLowerCase().includes(selectedIdCardMember.id.toLowerCase())) &&
                          savingsCodes.some(code => j.akun.startsWith(code) || j.ket.toLowerCase().includes("simpanan"))
                        );
                        return memberHistory.reduce((sum, j) => sum + (j.kredit || j.debet), 0).toLocaleString('id-ID');
                      })()}
                    </p>
                  </div>
                  <PlusCircle className="h-6 w-6 text-emerald-500 opacity-50" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    )}
  </div>
  );
}
