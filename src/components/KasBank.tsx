/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Plus, CheckCircle, Smartphone, Edit, FileDown } from 'lucide-react';
import { RekeningBank } from '../types';

interface KasBankProps {
  rekeningData: RekeningBank[];
  accessMode: "admin" | "view";
  onAddRekening: (nama: string, nomor: string, lokasi: string, saldo: number) => void;
  onUpdateRekening?: (id: string, nama: string, nomor: string, lokasi: string) => void;
}

export function KasBank(props: KasBankProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [nomor, setNomor] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [saldo, setSaldo] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // States for Editing
  const [editingRekening, setEditingRekening] = useState<RekeningBank | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editNomor, setEditNomor] = useState("");
  const [editLokasi, setEditLokasi] = useState("");

  // Clear error message whenever modal changes
  React.useEffect(() => {
    setErrorMsg("");
  }, [isModalOpen, editingRekening]);

  const startEdit = (item: RekeningBank) => {
    setEditingRekening(item);
    setEditNama(item.nama);
    setEditNomor(item.nomorRekening);
    setEditLokasi(item.lokasiText);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!editingRekening) return;
    if (!editNama || !editNomor || !editLokasi) {
      setErrorMsg("Mohon lengkapi semua isian!");
      return;
    }
    if (props.onUpdateRekening) {
      props.onUpdateRekening(editingRekening.id, editNama, editNomor, editLokasi);
    }
    setEditingRekening(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!nama || !nomor || !lokasi) {
      setErrorMsg("Mohon lengkapi data registrasi rekening bank baru!");
      return;
    }
    props.onAddRekening(nama, nomor, lokasi, saldo);
    setNama("");
    setNomor("");
    setLokasi("");
    setSaldo(0);
    setIsModalOpen(false);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Daftar Akun Kas & Rekening Bank System\r\n";
    csvContent += "ID Akun,Nama Akun/Bank,Nomor Rekening,Lokasi/Keterangan,Saldo Akhir (Rp)\r\n";
    
    props.rekeningData.forEach(item => {
      const row = [
        `"${item.id}"`,
        `"${item.nama.replace(/"/g, '""')}"`,
        `"${item.nomorRekening}"`,
        `"${item.lokasiText.replace(/"/g, '""')}"`,
        item.saldo.toString()
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KAS_DAN_BANK_Financial_System_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-red-600" /> Akun Kas &amp; Rekening Bank
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola instrumen kas likuid, saldo perbankan, dan penyimpanan brankas fisik koperasi
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 flex-wrap">
          <button
            id="export-kasbank-csv-btn"
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5 cursor-pointer"
            title="Download account list as CSV file"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
          {props.accessMode === "admin" && (
            <button
              id="btn-add-bank"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Hubungkan Rekening Baru
            </button>
          )}
        </div>
      </div>

      {/* BANK CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {props.rekeningData.map(item => {
          const isBankActive = item.status !== "Tidak Aktif";
          return (
            <div
              key={item.id}
              className={`rounded-xl border shadow-sm transition duration-200 relative overflow-hidden ${
                isBankActive 
                  ? "bg-white border-gray-100 hover:border-red-100 hover:shadow-md" 
                  : "bg-slate-50 border-slate-200/80 opacity-60 grayscale-[15%]"
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-gray-450 uppercase tracking-widest">
                    ALIRAN KAS LIKUID
                  </span>
                  {isBankActive ? (
                    <span className="p-1 px-2.5 text-[9px] bg-emerald-50 text-emerald-700 font-bold rounded-full flex items-center gap-1 border border-emerald-100">
                      <span className="block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> Terkoneksi
                    </span>
                  ) : (
                    <span className="p-1 px-2.5 text-[9px] bg-slate-100 text-slate-500 font-bold rounded-full flex items-center gap-1 border border-slate-200">
                      <span className="block h-1.5 w-1.5 bg-slate-400 rounded-full" /> Non-Aktif
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold tracking-tight uppercase truncate ${isBankActive ? 'text-gray-800' : 'text-slate-450 line-through'}`}>
                  {item.nama}
                </h3>
                <p className={`text-[11px] font-semibold font-mono mt-0.5 truncate ${isBankActive ? 'text-gray-400' : 'text-slate-400'}`}>
                  No: {item.nomorRekening}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <div className={`text-xl font-bold font-mono ${isBankActive ? 'text-gray-900' : 'text-slate-400'}`}>
                    Rp {item.saldo.toLocaleString('id-ID')}
                  </div>
                  {/* Tombol edit dialihkan ke Menu Pengaturan Sistem */}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                  Sistem Perekaman: {item.lokasiText}
                </p>
              </div>
              <div className="absolute top-0 right-0 p-5 opacity-[0.03] select-none pointer-events-none">
                <Landmark className="h-20 w-20" />
              </div>
              <div className={`h-1 w-full ${isBankActive ? 'bg-red-600' : 'bg-slate-300'}`} />
            </div>
          );
        })}
      </div>

      {/* BANNER INFO */}
      <div className="p-4 bg-red-50/50 border border-red-50 text-red-800 text-xs rounded-lg flex items-start gap-2.5">
        <Smartphone className="h-4 w-4 text-red-600 mt-0.5" />
        <div>
          <p className="font-bold">Informasi Sinkronisasi Buku Neraca</p>
          <p className="text-gray-600 mt-0.5 leading-relaxed">
            Seluruh saldo likuid di atas dirangkum langsung dari data jurnal umum operasional. Penambahan jurnal yang melibatkan akun-akun kas atau perbankan otomatis akan memperbarui saldo di dashboard ini secara akurat.
          </p>
        </div>
      </div>



      {/* DIALOG ADD BANK ACCOUNTS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Daftarkan Rekening Bank Lembaga</h3>
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
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Rekening / Lembaga Bank</label>
                <input
                  id="form-bank-name"
                  type="text"
                  required
                  placeholder="Contoh: BANK MANDIRI KOPERASI"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nomor Rekening Resmi</label>
                <input
                  id="form-bank-number"
                  type="text"
                  required
                  placeholder="Contoh: 900-12345-678"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-mono"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Lokasi / Keterangan Penempatan</label>
                <input
                  id="form-bank-location"
                  type="text"
                  required
                  placeholder="Contoh: Kantor Cabang Cikampek"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Saldo Deposito Buku Awal (Rp)</label>
                <input
                  id="form-bank-balance"
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-bold font-mono"
                  value={saldo || ""}
                  onChange={(e) => setSaldo(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded transition font-medium text-center"
                >
                  Batal
                </button>
                <button
                  id="submit-bank-btn"
                  type="submit"
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow transition flex items-center justify-center gap-1"
                >
                  <Landmark className="h-3.5 w-3.5" /> Sambungkan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
