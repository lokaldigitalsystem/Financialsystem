/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Notebook,
  BookOpen, 
  Boxes,
  Package, 
  ClipboardCheck, 
  RotateCcw,
  Landmark,
  Wallet, 
  Briefcase,
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  Coins,
  Users, 
  UserCheck,
  ListTodo,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sparkles,
  Save,
  Building2,
  Crown,
  Search,
  CheckCircle,
  XCircle,
  Info,
  Sliders,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Type
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot, db } from '../supabase';
import { Tenant } from '../types';
import { logSecurityEvent } from '../utils/auditLogger';

// Map icon names to Lucide components for dynamic rendering
export const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Notebook, BookOpen, Boxes, Package, ClipboardCheck, 
  RotateCcw, Landmark, Wallet, Briefcase, TrendingUp, FileSpreadsheet, 
  FileText, Coins, Users, UserCheck, ListTodo, Scale, ShieldAlert, 
  ShieldCheck, Lock, Sparkles, Building2, Crown, Search, HelpCircle
};

// Initial default modules if database is empty
const DEFAULT_SYSTEM_MODULES = [
  { id: "dashboard", name: "Dashboard Ringkasan", desc: "Dashboard utama, widget statistik, saldo berjalan, & pemberitahuan.", icon: "LayoutDashboard" },
  { id: "jurnal", name: "Jurnal Umum Akuntansi", desc: "Siklus pencatatan pembukuan debet-kredit akuntansi ganda.", icon: "Notebook" },
  { id: "bukubesar", name: "Buku Besar Ledger", desc: "Rincian mutasi setiap akun/COA secara spesifik dan mendalam.", icon: "BookOpen" },
  { id: "stok", name: "Logistik & Stok Barang", desc: "Katalog inventaris pupuk, bibit, sembako, & log gudang.", icon: "Boxes" },
  { id: "returpembelian", name: "Retur Pembelian Barang", desc: "Kembalikan stok ke supplier & penyesuaian dana otomatis.", icon: "RotateCcw" },
  { id: "stockopname", name: "Stock Opname Fisik", desc: "Pemeriksaan fisik stok manual, diskrepansi, & pencatatan audit.", icon: "ClipboardCheck" },
  { id: "kasbank", name: "Kas & Arus Rekening", desc: "Sistem kasir tunai instansi & transfer bank eksternal.", icon: "Landmark" },
  { id: "asettetap", name: "Aset Tetap & Depresiasi", desc: "Penyusutan aset mekanik / inventaris berkala otomatis.", icon: "Briefcase" },
  { id: "invoice", name: "E-Billing & Tagihan", desc: "Pengeluaran struk digital, penagihan piutang, & tempo lunas.", icon: "FileText" },
  { id: "rekappenjualan", name: "Rekap Penjualan Bulanan", desc: "Analisis grafik tren omset & performa item terlaris.", icon: "TrendingUp" },
  { id: "laporan", name: "Laporan Buku Besar", desc: "Neraca saldo otomatis & Laporan Laba Rugi akhir periode.", icon: "Coins" },
  { id: "kontak", name: "Hub Database Kontak", desc: "Penyimpanan data supplier, customer, & relasi bisnis.", icon: "Users" },
  { id: "anggota", name: "Manajemen Anggota", desc: "Profil simpan pinjam, iuran wajib pokok, & status keaktifan.", icon: "UserCheck" },
  { id: "coa", name: "Chart of Accounts (COA)", desc: "Strukturisasi pohon akun keuangan & pemetaan kategori.", icon: "ListTodo" },
  { id: "audit", name: "Audit Validasi Data", desc: "Verifikasi keseimbangan neraca & koreksi saldo deviasi.", icon: "Scale" },
  { id: "security_audit", name: "Jejak Audit Keamanan", desc: "Log aktivitas forensik, IP address login, & regulasi kepatuhan.", icon: "ShieldAlert" },
];

export const PLAN_DEFAULT_FEATURES: Record<"Trial" | "Basic" | "Premium" | "Enterprise", string[]> = {
  Trial: ["dashboard", "jurnal", "bukubesar", "kontak", "anggota", "kasbank"],
  Basic: ["dashboard", "jurnal", "bukubesar", "kontak", "anggota", "kasbank", "stok", "coa", "laporan", "returpembelian"],
  Premium: ["dashboard", "jurnal", "bukubesar", "kontak", "anggota", "kasbank", "stok", "coa", "laporan", "stockopname", "invoice", "rekappenjualan", "returpembelian"],
  Enterprise: ["dashboard", "jurnal", "bukubesar", "kontak", "anggota", "kasbank", "stok", "coa", "laporan", "stockopname", "invoice", "rekappenjualan", "asettetap", "security_audit", "audit", "returpembelian"]
};

interface SystemModule {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

interface SaaSFeatureManagementProps {
  tenants: Tenant[];
  currentUserEmail: string;
  currentUserName: string;
}

export const SaaSFeatureManagement: React.FC<SaaSFeatureManagementProps> = ({
  tenants,
  currentUserEmail,
  currentUserName
}) => {
  // Global Plan Tiering state
  const [tieringMatrix, setTieringMatrix] = useState<Record<string, string[]>>(PLAN_DEFAULT_FEATURES);
  const [moduleRegistry, setModuleRegistry] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Module Registry Editor State
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<SystemModule | null>(null);
  const [newModule, setNewModule] = useState<SystemModule>({ id: "", name: "", desc: "", icon: "Package" });

  // Tenant search & overrides state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Listen to Module Registry
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "module_registry"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setModuleRegistry(data.modules || DEFAULT_SYSTEM_MODULES);
      } else {
        // Initial setup
        setDoc(doc(db, "system_config", "module_registry"), { modules: DEFAULT_SYSTEM_MODULES })
          .then(() => setModuleRegistry(DEFAULT_SYSTEM_MODULES))
          .catch(e => console.warn("Failed initializing registry", e));
      }
    });
    return () => unsub();
  }, []);

  // Listen to the Global Feature Matrix doc on cloud
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "features_tiering"), (snap) => {
      if (snap.exists()) {
        setTieringMatrix(snap.data() as Record<string, string[]>);
      } else {
        setDoc(doc(db, "system_config", "features_tiering"), PLAN_DEFAULT_FEATURES)
          .catch(e => console.warn("Failed initializing default feature matrix in db", e));
      }
      setLoading(false);
    }, (err) => {
      console.warn("Could not listen to global feature matrix doc:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Handle Module Registry Ops
  const handleSaveModuleRegistry = async (updatedModules: SystemModule[]) => {
    try {
      await setDoc(doc(db, "system_config", "module_registry"), { modules: updatedModules });
      showToast('success', 'Registri modul berhasil diperbarui.');
      setIsAddingModule(false);
      setEditingModule(null);
      setNewModule({ id: "", name: "", desc: "", icon: "Package" });
    } catch (err: any) {
      showToast('error', `Gagal memperbarui registri: ${err.message}`);
    }
  };

  const handleAddModule = () => {
    if (!newModule.id || !newModule.name) return showToast('error', 'ID dan Nama modul wajib diisi!');
    if (moduleRegistry.some(m => m.id === newModule.id)) return showToast('error', 'ID Modul sudah digunakan!');
    
    const updated = [...moduleRegistry, newModule];
    handleSaveModuleRegistry(updated);
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;
    const updated = moduleRegistry.map(m => m.id === editingModule.id ? editingModule : m);
    handleSaveModuleRegistry(updated);
  };

  const handleDeleteModule = (id: string) => {
    if (!window.confirm(`Hapus modul '${id}'? Ini akan menghapus akses modul ini dari seluruh paket!`)) return;
    const updated = moduleRegistry.filter(m => m.id !== id);
    handleSaveModuleRegistry(updated);
  };

  // Update selectedTenant metadata if tenants refreshes
  useEffect(() => {
    if (selectedTenant) {
      const up = tenants.find(t => t.id === selectedTenant.id);
      if (up) setSelectedTenant(up);
    }
  }, [tenants, selectedTenant?.id]);

  // Handle saving Plan Module Matrix
  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    try {
      await setDoc(doc(db, "system_config", "features_tiering"), tieringMatrix);
      
      // Log the security event
      await logSecurityEvent({
        tenantId: "supercloud",
        tenantName: "Developer System",
        actorEmail: currentUserEmail,
        actorName: currentUserName,
        category: "Keamanan",
        severity: "CRITICAL",
        action: "Penyuntingan Matriks Modul Global",
        details: "Hubungan pemetaan modul & fitur per paket tiering berhasil diubah oleh superadmin.",
        status: "Sukses"
      });

      showToast('success', 'Matriks standardisasi fitur tiering berhasil disimpan di awan.');
    } catch (err: any) {
      showToast('error', `Gagal menyimpan matriks: ${err.message}`);
    } finally {
      setSavingMatrix(false);
    }
  };

  // Toggle module inside a specific plan tier configuration
  const handleTogglePlanModule = (plan: "Trial" | "Basic" | "Premium" | "Enterprise", moduleId: string) => {
    const currentList = [...(tieringMatrix[plan] || [])];
    let nextList: string[];
    if (currentList.includes(moduleId)) {
      nextList = currentList.filter(id => id !== moduleId);
    } else {
      nextList = [...currentList, moduleId];
    }

    setTieringMatrix({
      ...tieringMatrix,
      [plan]: nextList
    });
  };

  // Toggle custom feature override for a specific tenant directly
  const handleToggleTenantOverride = async (tenantId: string, moduleId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const currentOverrides = tenant.customFeatures || tieringMatrix[tenant.plan] || PLAN_DEFAULT_FEATURES[tenant.plan] || [];
    let updatedList: string[];

    if (currentOverrides.includes(moduleId)) {
      updatedList = currentOverrides.filter(id => id !== moduleId);
    } else {
      updatedList = [...currentOverrides, moduleId];
    }

    try {
      await setDoc(doc(db, "tenants", tenantId), {
        ...tenant,
        customFeatures: updatedList
      }, { merge: true });

      await logSecurityEvent({
        tenantId: "supercloud",
        tenantName: "Developer System",
        actorEmail: currentUserEmail,
        actorName: currentUserName,
        category: "Hak Akses",
        severity: "WARNING",
        action: "Perubahan Modul Tambahan Khusus",
        details: `Override kustom fitur '${moduleId}' berhasil disetel untuk tenant '${tenant.name}' (${tenantId}).`,
        status: "Sukses"
      });

      showToast('success', `Berhasil mengubah hak akses modul kustom untuk ${tenant.name}.`);
    } catch (err: any) {
      showToast('error', `Gagal menyimpan audit kustom: ${err.message}`);
    }
  };

  // Reset tenant custom overrides back to plan defaults
  const handleClearTenantOverrides = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    try {
      await setDoc(doc(db, "tenants", tenantId), {
        ...tenant,
        customFeatures: null 
      }, { merge: true });

      await logSecurityEvent({
        tenantId: "supercloud",
        tenantName: "Developer System",
        actorEmail: currentUserEmail,
        actorName: currentUserName,
        category: "Hak Akses",
        severity: "INFO",
        action: "Penyetelan Ulang Hak Akses Standar",
        details: `Menghapus seluruh modul tambahan kustom untuk tenant '${tenant.name}' (${tenantId}) kembali ke standar paket.`,
        status: "Sukses"
      });

      showToast('success', `Berhasil mengembalikan hak akses ${tenant.name} ke default standar.`);
    } catch (err: any) {
      showToast('error', `Gagal mereset: ${err.message}`);
    }
  };

  // Search filter matching
  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.ownerEmail.toLowerCase().includes(q) || t.plan.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* TOAST NOTIFICATION BLOCK */}
      {toast && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-md border animate-bounce fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
          {toast.message}
        </div>
      )}

      {/* INTRODUCTION HERO INFO PANEL */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-black tracking-widest text-[#001bb5] uppercase flex items-center gap-2 mb-1 animate-pulse">
            <Sliders className="h-4.5 w-4.5 text-indigo-650" /> FEATURE FLAGGING &amp; MODULAR TIERING ENGINE
          </span>
          <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
            Konfigurator Paket &amp; Tambahan Layanan (Add-on Modules)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-4xl">
            Sistem pengatur pembatasan akses digital desa. Anda dapat mengkonfigurasi hak akses modul bawaan per-taraf paket berlangganan secara global (Trial &rarr; Basic &rarr; Premium &rarr; Enterprise) ATAU menyematkan hak akses kustom (add-on khusus) langsung pada penyewa tertentu.
          </p>
        </div>
        <button
          onClick={() => setIsAddingModule(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Tambah Modul Baru
        </button>
      </div>

      {/* MODULE REGISTRY EDITOR (MODAL STYLE) */}
      {(isAddingModule || editingModule) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-left">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {isAddingModule ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit2 className="h-5 w-5 text-indigo-600" />}
                {isAddingModule ? "Registrasi Modul Baru" : "Edit Parameter Modul"}
              </h3>
              <button onClick={() => { setIsAddingModule(false); setEditingModule(null); }} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Modul (Unik)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    disabled={!!editingModule}
                    value={isAddingModule ? newModule.id : (editingModule?.id || "")}
                    onChange={(e) => setNewModule({...newModule, id: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                    placeholder="misal: e_voting"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Fitur</label>
                <div className="relative">
                  <Type className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={isAddingModule ? newModule.name : (editingModule?.name || "")}
                    onChange={(e) => isAddingModule ? setNewModule({...newModule, name: e.target.value}) : setEditingModule({...editingModule!, name: e.target.value})}
                    placeholder="misal: E-Voting Warga"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi Fungsi</label>
                <textarea
                  value={isAddingModule ? newModule.desc : (editingModule?.desc || "")}
                  onChange={(e) => isAddingModule ? setNewModule({...newModule, desc: e.target.value}) : setEditingModule({...editingModule!, desc: e.target.value})}
                  placeholder="Jelaskan kegunaan modul ini..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none h-24 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Ikon Visual</label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {Object.keys(ICON_MAP).map(iconName => {
                    const Icon = ICON_MAP[iconName];
                    const isSelected = (isAddingModule ? newModule.icon : editingModule?.icon) === iconName;
                    return (
                      <button
                        key={iconName}
                        onClick={() => isAddingModule ? setNewModule({...newModule, icon: iconName}) : setEditingModule({...editingModule!, icon: iconName})}
                        className={`p-2 rounded-lg flex items-center justify-center transition ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm'}`}
                        title={iconName}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex items-center gap-3">
              <button 
                onClick={() => isAddingModule ? handleAddModule() : handleUpdateModule()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> {isAddingModule ? "Daftarkan Modul" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TAB COLUMN 1: GLOBAL PLANS INTEGRATION MATRIX CONFIG (Lg: 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Metode Standardisasi Global</span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="h-4.5 w-4.5 text-[#001bb5]" /> Matriks Hak Akses Standardisasi Paket
              </h3>
            </div>
            <button
              onClick={handleSaveMatrix}
              disabled={savingMatrix}
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {savingMatrix ? 'Menyimpan...' : 'Simpan Matriks'}
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
            {loading ? (
              <div className="py-24 text-center text-xs font-semibold text-slate-400">Loading parameter matrix from cloud...</div>
            ) : (
              <div className="space-y-4">
                {moduleRegistry.map((mod, idx) => {
                  const IconComponent = ICON_MAP[mod.icon] || Package;
                  return (
                    <div key={mod.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                      
                      {/* Left: module descriptive info */}
                      <div className="flex items-start gap-3 max-w-sm text-left">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0 mt-0.5">
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-[11.5px] font-black text-slate-900 leading-tight uppercase tracking-tight">{mod.name}</p>
                            <div className="hidden group-hover:flex items-center gap-1">
                              <button onClick={() => setEditingModule(mod)} className="p-1 text-indigo-600 hover:bg-white rounded-md transition"><Edit2 className="h-3 w-3" /></button>
                              <button onClick={() => handleDeleteModule(mod.id)} className="p-1 text-rose-600 hover:bg-white rounded-md transition"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{mod.desc}</p>
                          <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">Modul ID: {mod.id}</span>
                        </div>
                      </div>

                      {/* Right: checklist buttons representing each Plan */}
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {["Trial", "Basic", "Premium", "Enterprise"].map(planName => {
                          const isEnabled = (tieringMatrix[planName] || []).includes(mod.id);
                          const planColor = 
                            planName === 'Enterprise' ? 'border-amber-200 hover:bg-amber-50 text-amber-700 font-bold' :
                            planName === 'Premium' ? 'border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold' :
                            planName === 'Basic' ? 'border-blue-200 hover:bg-blue-50 text-blue-700 font-bold' :
                            'border-slate-200 hover:bg-slate-100 text-slate-600 font-bold';

                          return (
                            <button
                              key={planName}
                              type="button"
                              onClick={() => handleTogglePlanModule(planName as any, mod.id)}
                              className={`px-3 py-1.5 border text-[9.5px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                                isEnabled 
                                  ? `${planName === 'Enterprise' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : planName === 'Premium' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : planName === 'Basic' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-700 text-white border-slate-700 shadow-xs'}`
                                  : `${planColor} bg-white shadow-xs`
                              }`}
                              title={`Toggle ${mod.name} for ${planName}`}
                            >
                              {isEnabled ? '✓' : '✗'} {planName}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] leading-relaxed font-sans font-bold text-blue-800 flex items-start gap-2 text-left">
            <Info className="h-4.5 w-4.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-extrabold uppercase mb-0.5">Catatan Perubahan Model</p>
              <span>Setiap kali Anda mengubah hak akses standardisasi di atas, seluruh tenant yang terdaftar pada plan tersebut akan terpengaruh SECARA DINAMIS pada penyegaran sistem berikutnya. Bila tenant memiliki modul custom override yang sudah disimpan, pengaturan custom override tersebut yang akan diprioritaskan.</span>
            </div>
          </div>

        </div>

        {/* TAB COLUMN 2: INDIVIDUAL TENANT CUSTOM ADD-ONS & OVERRIDES (Lg: 5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="border-b border-slate-50 pb-3 text-left">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Metode Custom Override</span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4.5 w-4.5 text-[#001bb5]" /> Modul Tambahan Kustom per Penyewa
              </h3>
            </div>

            {/* Keyword tenant search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari koperasi penyewa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Tenant Selection List */}
            <div className="overflow-y-auto max-h-[200px] border border-slate-100 rounded-2xl p-2 bg-slate-50/50 space-y-1">
              {filteredTenants.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6">Koperasi penyewa tidak ditemukan.</p>
              ) : (
                filteredTenants.map(t => {
                  const isCurSelected = selectedTenant?.id === t.id;
                  const overridingCount = t.customFeatures ? t.customFeatures.length : 0;
                  const planBadgeColor = 
                    t.plan === 'Enterprise' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    t.plan === 'Premium' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    t.plan === 'Basic' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-slate-50 text-slate-600 border-slate-100';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTenant(t)}
                      className={`p-2.5 rounded-xl cursor-pointer transition border text-left flex items-center justify-between gap-3 ${
                        isCurSelected 
                          ? 'bg-indigo-100/50 border-indigo-600'
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2 text-left">
                        <p className="text-xs font-black text-slate-800 leading-none truncate">{t.name}</p>
                        <p className="text-[9.5px] text-slate-500 truncate font-semibold block leading-none">ID: <span className="uppercase font-mono font-bold">{t.id}</span> &middot; {t.ownerEmail}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <span className={`px-2 py-0.5 text-[8.5px] uppercase font-black tracking-wider border rounded-md whitespace-nowrap ${planBadgeColor}`}>
                          {t.plan}
                        </span>
                        {t.customFeatures ? (
                          <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[8.5px] font-black rounded-sm whitespace-nowrap" title="Has custom permission overrides">
                            MODK ({overridingCount})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8.5px] font-bold rounded-sm whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detailed Inspector & Switcher for Selected Tenant Overrides */}
          {selectedTenant ? (
            <div className="border border-indigo-100 bg-indigo-50/25 p-4 rounded-2xl text-left space-y-3.5 flex-1 flex flex-col justify-between max-h-[350px]">
              <div className="border-b border-indigo-100/60 pb-2.5 flex items-start justify-between gap-3 shrink-0">
                <div className="space-y-0.5 max-w-xs text-left">
                  <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest leading-none">Workspace Terpilih</p>
                  <p className="text-xs font-black text-slate-850 truncate leading-snug uppercase mt-1">{selectedTenant.name}</p>
                  <p className="text-[9.5px] text-slate-450 leading-none font-semibold">Taraf Paket: <span className="font-bold text-indigo-600 uppercase font-mono">{selectedTenant.plan}</span></p>
                </div>
                {selectedTenant.customFeatures && (
                  <button
                    type="button"
                    onClick={() => handleClearTenantOverrides(selectedTenant.id)}
                    className="text-[9.5px] font-black text-rose-700 hover:text-rose-900 uppercase tracking-wider transition hover:underline"
                    title="Reset to default plan features"
                  >
                    Clear Override
                  </button>
                )}
              </div>

              {/* Toggle controls checklist */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {moduleRegistry.map(mod => {
                  const Icon = ICON_MAP[mod.icon] || Package;
                  // If overridden, check from selection overrides, otherwise falls back to Plan standard
                  const currentList = selectedTenant.customFeatures || tieringMatrix[selectedTenant.plan] || PLAN_DEFAULT_FEATURES[selectedTenant.plan] || [];
                  const isChecked = currentList.includes(mod.id);
                  const isDirectOverride = selectedTenant.customFeatures?.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleTenantOverride(selectedTenant.id, mod.id)}
                      className={`p-2 rounded-xl transition border cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked 
                          ? 'bg-white border-indigo-3 w-full shadow-xs' 
                          : 'bg-white/40 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 max-w-[80%] text-left">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isChecked ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5 truncate text-left">
                          <p className="text-[10.5px] font-black text-slate-850 leading-none truncate">{mod.name}</p>
                          <p className="text-[8.5px] text-slate-400 font-medium truncate leading-none">{mod.desc}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-right">
                        {isDirectOverride && (
                          <span className="text-[7.5px] uppercase font-black text-rose-700 bg-rose-50 border border-rose-100 px-1 rounded-sm leading-none py-0.5">Add-On</span>
                        )}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Swifts handled by parent container click
                          className="h-3.5 w-3.5 text-indigo-650 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Integrity certification footnote */}
              <div className="pt-2 border-t border-indigo-100/60 leading-tight text-[9px] font-bold text-slate-450 italic text-left">
                💡 Fitur custom (Add-on) didata secara real-time pada cloud dan diproritaskan saat otorisasi login client.
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-150 p-12 rounded-2xl bg-slate-50/50 text-center space-y-1.5 flex-1 flex flex-col justify-center items-center">
              <Sparkles className="h-8 w-8 text-indigo-300 animate-bounce" />
              <p className="text-xs font-bold text-slate-500">Belum ada Koperasi Terpilih</p>
              <p className="text-[9.5px] text-slate-400 max-w-xs font-semibold leading-relaxed">
                Pilih Koperasi penyewa dari daftar pencarian di atas untuk menyisipkan modul kustom khusus (add-on) bypass fitur paket standardisasi.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
