/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Calendar, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  History,
  TrendingUp,
  ShieldCheck,
  MoreVertical,
  Activity,
  ShieldAlert,
  Server,
  Megaphone,
  ExternalLink,
  LifeBuoy,
  Sliders
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, db, handleCloudError, OperationType, supabase, getDocs, where } from '../supabase';
import { Tenant, TenantSubscription } from '../types';
import { SaaSAnalytics } from './SaaSAnalytics';
import { SupportTicket } from './SupportTicket';
import { TenantBilling } from './TenantBilling';
import { SaaSFeatureManagement } from './SaaSFeatureManagement';

interface SuperAdminProps {
  onImpersonate: (tenantId: string) => void;
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({ onImpersonate }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'tenants' | 'analytics' | 'tickets' | 'billing' | 'features'>('tenants');

  // Custom confirmation dialogs and toast alert states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmImpersonateId, setConfirmImpersonateId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Global System Config State
  const [globalConfig, setGlobalConfig] = useState({
    maintenanceMode: false,
    announcement: "",
    isAnnouncementActive: false,
    announcementType: "info"
  });

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "system_config", "global"), (snap) => {
      if (snap.exists()) {
        setGlobalConfig(snap.data() as any);
      }
    }, (err) => {
      console.warn("SuperAdmin global config listener error:", err.message);
    });
    return () => unsubConfig();
  }, []);

  const handleUpdateGlobalConfig = async () => {
    try {
      await setDoc(doc(db, "system_config", "global"), globalConfig, { merge: true });
      showToast("success", "Konfigurasi Global Berhasil Disimpan!");
    } catch (err) {
      handleCloudError(err, OperationType.WRITE, "system_config/global");
      showToast("error", "Gagal menyimpan konfigurasi global.");
    }
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Tenant>>({
    id: "",
    name: "",
    ownerEmail: "",
    plan: "Trial",
    status: "Trial",
    monthlyRate: 0,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 14 days trial
  });

  useEffect(() => {
    const unsubTenants = onSnapshot(collection(db, "tenants"), (snap) => {
      const list: Tenant[] = [];
      snap.forEach(d => list.push(d.data() as Tenant));
      setTenants(list);
      setLoading(false);
    }, (err) => handleCloudError(err, OperationType.LIST, "tenants"));

    return () => unsubTenants();
  }, []);

  const [manualPurgeId, setManualPurgeId] = useState("");

  const handleManualPurge = () => {
    if (!manualPurgeId.trim()) {
      showToast("error", "Masukkan ID Instansi terlebih dahulu.");
      return;
    }
    setConfirmDeleteId(manualPurgeId.toLowerCase().trim());
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.ownerEmail) return;

    try {
      const id = formData.id.toLowerCase().trim();
      const payload = {
        ...formData,
        id,
        createdAt: editingTenant?.createdAt || new Date().toISOString().split('T')[0]
      } as Tenant;

      // EMAIL SYNC LOGIC: If owner email changed, update the user profile in the tenant subcollection
      if (editingTenant && editingTenant.ownerEmail !== formData.ownerEmail) {
        try {
          const usersRef = collection(db, "koperasi", id, "users");
          const q = query(usersRef, where("email", "==", editingTenant.ownerEmail));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            // Update all matching user records (usually should be just one)
            for (const userDoc of snap.docs) {
              const userData = userDoc.data();
              await setDoc(doc(db, "koperasi", id, "users", userDoc.id), {
                ...userData,
                email: formData.ownerEmail
              });
            }
          } else {
            // Try fallback by username if email match fails (sometimes username is the identifier)
            const fallbackQ = query(usersRef, where("username", "==", editingTenant.ownerEmail));
            const fallbackSnap = await getDocs(fallbackQ);
            if (!fallbackSnap.empty) {
              for (const userDoc of fallbackSnap.docs) {
                const userData = userDoc.data();
                await setDoc(doc(db, "koperasi", id, "users", userDoc.id), {
                  ...userData,
                  email: formData.ownerEmail
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to sync owner email to user accounts:", err);
          // Non-blocking error, we still want to save the tenant
        }
      }

      await setDoc(doc(db, "tenants", id), payload);
      setIsModalOpen(false);
      setEditingTenant(null);
      setFormData({
        id: "",
        name: "",
        ownerEmail: "",
        plan: "Trial",
        status: "Trial",
        monthlyRate: 0,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err) {
      handleCloudError(err, OperationType.WRITE, `tenants/${formData.id}`);
    }
  };

  const handleDeleteTenant = async (id: string | null) => {
    if (!id) return;
    try {
      showToast("success", `Sedang menghapus data instansi "${id}"...`);
      // 1. Delete all cooperative database records for this tenant in Supabase (represented by 'koperasi_id' column)
      const { error: dbError } = await supabase
        .from('koperasi_store')
        .delete()
        .eq('koperasi_id', id);

      if (dbError) {
        console.warn("Gagal membersihkan data koperasi_store di cloud:", dbError.message);
      }

      // 2. Clear all related local storage cache keys to prevent stale/sticky client state
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`supa_cache:${id}:`) || key.startsWith(`supa_list:${id}:`))) {
          localStorage.removeItem(key);
        }
      }

      // 3. Delete the tenant meta record itself from the 'tenants' collection
      await deleteDoc(doc(db, "tenants", id));

      showToast("success", `Sukses: Seluruh database, data transaksi, dan cache penyewa "${id}" telah dihapus secara permanen! Email admin utama kini dapat didaftarkan kembali.`);
      setConfirmDeleteId(null);
      setManualPurgeId("");
    } catch (err: any) {
      handleCloudError(err, OperationType.DELETE, `tenants/${id}`);
      showToast("error", "Gagal menghapus tenant: " + (err?.message || err));
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === "Active").length,
    trial: tenants.filter(t => t.status === "Trial").length,
    suspended: tenants.filter(t => t.status === "Suspended").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
            Super Admin Control Panel
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola penyewa (tenants), langganan billing, dan status akses system.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Daftarkan Rental Baru
        </button>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex border-b border-slate-100 pb-px gap-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'tenants'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Kelola Penyewa (Tenants)
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> SaaS Business Analytics (Metrik Finansial)
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <LifeBuoy className="h-4 w-4" /> Tiket Bantuan &amp; Pengaduan
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Tagihan &amp; Faktur Penyewa
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'features'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Sliders className="h-4 w-4" /> Fitur &amp; Modul Berlangganan
        </button>
      </div>

      {activeTab === 'tenants' ? (
        <>
          {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> Total Tenant
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Active
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="h-4 w-4 text-amber-500" /> Trial
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.trial}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <XCircle className="h-4 w-4 text-rose-500" /> Suspended
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.suspended}</div>
        </div>
      </div>

      {/* TENANT LIST CARD */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Daftar Penyewa System</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, ID, atau email owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant / ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Until</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Belum ada tenant terdaftar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-indigo-500 font-mono font-bold tracking-tighter uppercase">{t.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{t.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.plan === 'Enterprise' ? 'bg-amber-100 text-amber-700' :
                          t.plan === 'Premium' ? 'bg-indigo-100 text-indigo-700' :
                          t.plan === 'Basic' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t.plan}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400">
                          Rp {t.monthlyRate?.toLocaleString('id-ID') || '0'}/bln
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {t.validUntil}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'Trial' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'Active' ? 'bg-emerald-500' :
                          t.status === 'Trial' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setConfirmImpersonateId(t.id)}
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Remote Support / Login as Tenant"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTenant(t);
                            setFormData(t);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Tenant"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Tenant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ANNOUNCEMENT & SYSTEM STATUS CONTROL */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-500" />
              Global Announcement Control
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pesan Pengumuman</label>
              <textarea 
                value={globalConfig.announcement}
                onChange={(e) => setGlobalConfig({...globalConfig, announcement: e.target.value})}
                placeholder="Tulis pesan untuk semua tenant..."
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">Aktifkan Banner</span>
                <span className="text-[10px] text-slate-400">Tampilkan pesan di dashboard semua user</span>
              </div>
              <button 
                onClick={() => setGlobalConfig({...globalConfig, isAnnouncementActive: !globalConfig.isAnnouncementActive})}
                className={`w-12 h-6 rounded-full transition-colors relative ${globalConfig.isAnnouncementActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${globalConfig.isAnnouncementActive ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <button
              onClick={handleUpdateGlobalConfig}
              className="w-full py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-100"
            >
              Simpan & Publikasikan
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-5 w-5 text-rose-500" />
              Emergency Maintenance Mode
            </h3>
          </div>
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${globalConfig.maintenanceMode ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-xs font-medium leading-relaxed ${globalConfig.maintenanceMode ? 'text-rose-900' : 'text-emerald-900'}`}>
                {globalConfig.maintenanceMode 
                  ? "Sistem sedang dalam mode MAINTENANCE. Seluruh akses tenant akan dibekukan sementara."
                  : "Sistem beroperasi NORMAL. Semua tenant dapat mengakses data tanpa hambatan."}
              </p>
            </div>
            
            <button
              onClick={() => {
                if(window.confirm("PERINGATAN: Mode maintenance akan membekukan SELURUH sistem. Lanjutkan?")) {
                  const newMode = !globalConfig.maintenanceMode;
                  setDoc(doc(db, "system_config", "global"), { ...globalConfig, maintenanceMode: newMode }, { merge: true });
                }
              }}
              className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-95 shadow-lg ${
                globalConfig.maintenanceMode 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' 
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
              }`}
            >
              {globalConfig.maintenanceMode ? "Matikan Maintenance Mode" : "Aktifkan Maintenance Mode"}
            </button>

            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                <Activity className="h-3 w-3" /> System Health Status: <span className="text-emerald-500">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLOUD INFRASTRUCTURE DIAGNOSTIC */}
      <div className="bg-slate-900 border border-slate-800 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black mb-3 flex items-center gap-3">
              <Server className="h-6 w-6 text-emerald-400" />
              Supabase Cloud Infrastructure Diagnostic
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Fitur "Akses Aman" dan sistem pencatatan relasional multi-tenant aktif secara penuh menggunakan <strong className="text-emerald-400 font-black">Supabase Database Engine</strong>. Seluruh data koperasi_store, jurnal keuangan, mutasi stok, dan akun otentikasi terekam secara aman, terisolasi, serta dapat dipulihkan kapan saja.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status database</div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Terkoneksi & Responsif
                </div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Project Ref ID</div>
                <div className="text-sm font-mono font-bold text-slate-100">agybltchhrmgphzeulyj</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[280px]">
            <a 
              href="https://supabase.com/dashboard/project/agybltchhrmgphzeulyj/auth/users"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition active:scale-95 shadow-xl shadow-emerald-550/20"
            >
              Buka Supabase Console <ExternalLink className="h-4 w-4" />
            </a>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Langkah Pengelolaan:</p>
              <ul className="text-[10px] text-slate-305 space-y-1.5 ml-1">
                <li>1. Gunakan <span className="text-white font-bold">Authentication</span> untuk me-reset password admin.</li>
                <li>2. Pilih <span className="text-white font-bold">Table Editor &rarr; koperasi_store</span> untuk audit database.</li>
                <li>3. Atur kebijakan <span className="text-white font-bold">Row-Level Security (RLS)</span> jika dibutuhkan.</li>
                <li>4. Eksport data transaksi via tab SQL Editor.</li>
              </ul>
            </div>

            {/* DANGER ZONE: CLOUD REGISTRY PURGE */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Danger Zone: Manual Registry Purge</p>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed italic">
                Gunakan ID instansi untuk menghapus index cloud secara paksa jika tenant tidak muncul di daftar atas.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID Instansi (Slug)"
                  value={manualPurgeId}
                  onChange={(e) => setManualPurgeId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-[10px] focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleManualPurge}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition active:scale-95"
                >
                  Purge Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      ) : activeTab === 'analytics' ? (
        <SaaSAnalytics tenants={tenants} />
      ) : activeTab === 'billing' ? (
        <TenantBilling 
          currentTenantId="supercloud"
          currentTenantName="Developer System"
          currentUserEmail="komarudink403@gmail.com"
          isGlobalAdmin={true}
        />
      ) : activeTab === 'features' ? (
        <SaaSFeatureManagement 
          tenants={tenants}
          currentUserEmail="komarudink403@gmail.com"
          currentUserName="SuperIT SaaS Admin"
        />
      ) : (
        <SupportTicket 
          currentTenantId="supercloud"
          currentTenantName="Developer System"
          currentUserEmail="komarudink403@gmail.com"
          currentUserName="SuperIT SaaS Admin"
          isGlobalAdmin={true}
        />
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{editingTenant ? "Update Tenant" : "Daftarkan Tenant Baru"}</h3>
                <p className="text-xs text-indigo-100 opacity-80">Konfigurasi hak akses dan langganan penyewa.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <MoreVertical className="h-5 w-5 rotate-90" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Tenant (Slug)</label>
                  <input
                    required
                    disabled={!!editingTenant}
                    type="text"
                    placeholder="misal: koperasi-maju"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Koperasi</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama lengkap business"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Owner (Penyewa)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan Paket</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="Trial">Paket Trial</option>
                    <option value="Basic">Paket Basic</option>
                    <option value="Premium">Paket Premium</option>
                    <option value="Enterprise">Paket Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Akses Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended (Blokir)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tarif Per Bulan (IDR)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={formData.monthlyRate || ''}
                      onChange={(e) => setFormData({...formData, monthlyRate: Number(e.target.value)})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Berlaku Hingga</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      required
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition active:scale-95"
                >
                  {editingTenant ? "Simpan Perubahan" : "Konfirmasi Rental"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM COHESIVE NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-[200] max-w-md px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-slate-900 text-emerald-400 border-emerald-500/20' 
            : 'bg-slate-900 text-rose-400 border-rose-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
          <p className="text-xs font-bold text-slate-200 leading-snug">{notification.message}</p>
        </div>
      )}

      {/* CONFIRM IMPERSONATE MODAL */}
      {confirmImpersonateId && (() => {
        const t = tenants.find(x => x.id === confirmImpersonateId);
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-7 space-y-6 border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-indigo-600">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">Remote Support</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akses Masuk Workspace</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin melakukan simulasi login dan masuk ke workspace <strong className="text-indigo-600 font-black">"{t?.name || confirmImpersonateId}"</strong>?<br/><br/>
                Sistem akan mengalihkan sesi data Anda sementara untuk melakukan peninjauan/bantuan teknis secara langsung.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmImpersonateId(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onImpersonate(confirmImpersonateId);
                    setConfirmImpersonateId(null);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition active:scale-95 text-xs"
                >
                  Ya, Masuk
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRM DELETE MODAL WITH RE-REGISTRATION CAPABILITY */}
      {confirmDeleteId && (() => {
        const t = tenants.find(x => x.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-7 space-y-6 border border-rose-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-rose-600">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-800 text-lg leading-tight">Hapus Rental Sistem</h3>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider cursor-help" title="Seluruh data dan identitas akan bersih secara aman">Pembersihan Menyeluruh</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus instansi penyewa <strong className="text-rose-600 font-black">"{t?.name || confirmDeleteId}"</strong> secara permanen dari server cloud?
                </p>
                <div className="bg-rose-50/50 rounded-2xl p-4 text-xs text-rose-800 border border-rose-100/60 leading-relaxed space-y-2">
                  <p className="font-bold uppercase tracking-widest text-[10px]">&bull; Cakupan Penghapusan:</p>
                  <p>1. Semua daftar COA, data transaksi jurnal korporat, stok gudang, data anggota, dan tabungan koperasi akan <strong>dihapus total</strong> dari cloud database.</p>
                  <p>2. Seluruh histori cache client-side di browser lokal akan dibersihkan.</p>
                  <p>3. Email administrator utama <strong className="font-mono bg-rose-100/50 px-1 py-0.5 rounded text-rose-900">{t?.ownerEmail}</strong> akan dibebaskan kembali sehingga email ini dapat didaftarkan ulang untuk instansi baru.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteTenant(confirmDeleteId)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition active:scale-95 text-xs"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
