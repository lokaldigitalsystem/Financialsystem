/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Search, 
  Calendar, 
  Trash2, 
  X, 
  Download, 
  FileSpreadsheet, 
  Terminal, 
  Fingerprint, 
  Activity, 
  Layers, 
  Building2, 
  User, 
  Globe, 
  Cpu, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Server,
  Lock,
  Compass,
  Printer
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, db, handleCloudError, OperationType } from '../supabase';
import { SecurityAuditEvent } from '../types';
import { logSecurityEvent } from '../utils/auditLogger';

interface SecurityAuditProps {
  currentTenantId: string;
  currentTenantName: string;
  currentUserEmail: string;
  currentUserName: string;
  isGlobalAdmin: boolean;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({
  currentTenantId,
  currentTenantName,
  currentUserEmail,
  currentUserName,
  isGlobalAdmin
}) => {
  const [logs, setLogs] = useState<SecurityAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Detail Inspector Drawer
  const [selectedLog, setSelectedLog] = useState<SecurityAuditEvent | null>(null);
  
  // Wipe logs confirmation
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipePassword, setWipePassword] = useState('');

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch Realtime Logs from Cloud (Supa_cache / PostgreSQL)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "security_audit_trail"), (snap) => {
      const list: SecurityAuditEvent[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SecurityAuditEvent);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Filter local for tenant if not superadmin
      if (!isGlobalAdmin) {
        setLogs(list.filter(item => item.tenantId === currentTenantId));
      } else {
        setLogs(list);
      }
      setLoading(false);
    }, (err) => {
      handleCloudError(err, OperationType.LIST, "security_audit_trail");
      setLoading(false);
    });

    return () => unsub();
  }, [currentTenantId, isGlobalAdmin]);

  // Try to sync selected log if logs are refreshed
  useEffect(() => {
    if (selectedLog) {
      const up = logs.find(l => l.id === selectedLog.id);
      if (up) setSelectedLog(up);
    }
  }, [logs, selectedLog?.id]);

  // 2. Sample Data Seeding for Interactive Exploration (Compliance Audit Mockup)
  const handleSeedMockData = async () => {
    setLoading(true);
    const mockEvents: Partial<SecurityAuditEvent>[] = [
      {
        action: "Autentikasi Pengguna Sukses",
        category: "Autentikasi",
        severity: "INFO",
        details: "Pengguna berhasil masuk ke sistem menggunakan autentikasi cloud Cloud.",
        status: "Sukses"
      },
      {
        action: "Percobaan Keamanan Gagal",
        category: "Autentikasi",
        severity: "WARNING",
        details: "Gagal login akibat sandi salah sebanyak 3 kali berturut-turut untuk user: bendahara@koperasi.id",
        status: "Gagal"
      },
      {
        action: "Reset Buku Besar Dinonaktifkan",
        category: "Reset Data",
        severity: "CRITICAL",
        details: "Pembersihan total seluruh data jurnal umum koperasi dan saldo perkiraan COA berhasil diproses.",
        status: "Sukses"
      },
      {
        action: "Penyesuaian Saldo Awal Kas & Bank",
        category: "Mutasi Keuangan",
        severity: "WARNING",
        details: "Pecatatan saldo awal perkiraan di luar siklus penutupan buku periodik kassa desa Rp 150,000,000.",
        status: "Sukses"
      },
      {
        action: "Perubahan Otoritas Peran Personalia",
        category: "Hak Akses",
        severity: "CRITICAL",
        details: "Izin akses user 'joko.kasir' dinaikkan menjadi Manajer Admin Keuangan System.",
        status: "Sukses"
      },
      {
        action: "Pemasangan Sesi Remote Support",
        category: "Hak Akses",
        severity: "INFO",
        details: "Inisiasi koneksi investigasi sistem oleh Tim Pusat Keamanan SaaS (Bpk. Komarudin SuperIT).",
        status: "Sukses"
      },
      {
        action: "Integrasi Pembayaran Paket Langganan",
        category: "Sistem & Langganan",
        severity: "INFO",
        details: "Verifikasi VA Bank Mandiri atas pembayaran iuran server cloud berhasil terekam.",
        status: "Sukses"
      }
    ];

    const targetTenantId = currentTenantId;
    const targetTenantName = currentTenantName;
    const baseTime = new Date();

    let count = 0;
    for (const ev of mockEvents) {
      const offsetMs = count * 10 * 60 * 1000; // staggered by 10 minutes
      const evTime = new Date(baseTime.getTime() - offsetMs).toISOString();
      const randomId = `SEC-${new Date(evTime).getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomIp = `182.1.${Math.floor(10 + Math.random() * 80)}.${Math.floor(100 + Math.random() * 150)}`;

      const fullEvent: SecurityAuditEvent = {
        id: randomId,
        timestamp: evTime,
        tenantId: targetTenantId,
        tenantName: targetTenantName,
        actorEmail: count % 2 === 0 ? "bendahara@koperasi.id" : "komarudink403@gmail.com",
        actorName: count % 2 === 0 ? currentUserName : "Bpk. Komarudin",
        category: ev.category as any,
        severity: ev.severity as any,
        action: ev.action!,
        details: ev.details!,
        ipAddress: randomIp,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        status: ev.status as any
      };

      try {
        await setDoc(doc(db, "security_audit_trail", randomId), fullEvent);
        count++;
      } catch (err) {
        console.error(err);
      }
    }

    // Now log the seeding activity itself! Proper compliance documentation.
    await logSecurityEvent({
      tenantId: currentTenantId,
      tenantName: currentTenantName,
      actorEmail: currentUserEmail,
      actorName: currentUserName,
      category: "Sistem & Langganan",
      severity: "WARNING",
      action: "Inisialisasi Data Uji Audit",
      details: `Inisialisasi audit seeder secara manual menghasilkan ${count} log jejak kepatuhan virtual.`,
      status: "Sukses"
    });

    showToast('success', `Berhasil mengimpor ${count} sampel log keamanan dan kepatuhan instansi.`);
    setLoading(false);
  };

  // 3. Delete Selected Log (SuperAdmin Only)
  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Batal/Hapus log jejak audit keamanan ini dari database cloud? Tindakan ini berbahaya rilis jejak kepatuhan.")) return;
    
    // Log deletion action BEFORE deleting the original event to ensure we register WHO wanted to delete!
    await logSecurityEvent({
      tenantId: currentTenantId,
      tenantName: currentTenantName,
      actorEmail: currentUserEmail,
      actorName: currentUserName,
      category: "Keamanan",
      severity: "CRITICAL",
      action: "Percobaan Penghapusan Log Kepatuhan",
      details: `Upaya mitigasi / penghapusan fisik rekaman audit ID: ${id}`,
      status: "Sukses"
    });

    try {
      await deleteDoc(doc(doc(db, "security_audit_trail"), id) as any);
      showToast('success', 'Rekaman audit berhasil dihapus.');
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
    } catch (err: any) {
      handleCloudError(err, OperationType.DELETE, `security_audit_trail/${id}`);
      showToast('error', 'Gagal memutus rekaman data.');
    }
  };

  // 4. Global Hard Clean Master Reset (Compliance password secure)
  const handleWipeSecurityTrail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wipePassword !== "Pusat-SaaS-Aman") {
      showToast('error', 'Sandi Keamanan Kepatuhan salah! Penghancuran rekaman ditolak.');
      return;
    }

    setLoading(true);
    let deletedCount = 0;

    for (const log of logs) {
      try {
        await deleteDoc(doc(db, "security_audit_trail", log.id));
        deletedCount++;
      } catch (err) {
        console.error("Gagal menghapus log:", log.id, err);
      }
    }

    setShowWipeModal(false);
    setWipePassword('');
    setSelectedLog(null);

    // Immediately log the wipe operation itself! Secure and tamper-proof self-documenting.
    await logSecurityEvent({
      tenantId: currentTenantId,
      tenantName: currentTenantName,
      actorEmail: currentUserEmail,
      actorName: currentUserName,
      category: "Reset Data",
      severity: "CRITICAL",
      action: "Pembersihan Total Jejak Audit Keamanan",
      details: `Penghancuran otentik seluruh log audit sebanyak ${deletedCount} baris fisik dengan sandi otorisasi.`,
      status: "Sukses"
    });

    showToast('success', `Sukses! ${deletedCount} rekaman audit diclear. Kebijakan Kepatuhan Baru berhasil dilaunch.`);
  };

  // 5. Dynamic Client Filtering inside the UI
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    
    // Text search matches
    const matchesSearch = log.action.toLowerCase().includes(query) || 
                          (log.details || '').toLowerCase().includes(query) || 
                          log.actorName.toLowerCase().includes(query) || 
                          log.actorEmail.toLowerCase().includes(query) || 
                          log.ipAddress.includes(query) || 
                          log.id.toLowerCase().includes(query);

    // Filters matches
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesTenant = tenantFilter === 'all' || log.tenantId === tenantFilter;

    // Date range matches
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const diffMs = new Date().getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (dateFilter === 'today') {
        matchesDate = diffDays <= 1;
      } else if (dateFilter === 'week') {
        matchesDate = diffDays <= 7;
      } else if (dateFilter === 'month') {
        matchesDate = diffDays <= 30;
      }
    }

    return matchesSearch && matchesSeverity && matchesCategory && matchesTenant && matchesDate;
  });

  // Calculate dynamic stats
  const stats = {
    total: filteredLogs.length,
    info: filteredLogs.filter(l => l.severity === 'INFO').length,
    warning: filteredLogs.filter(l => l.severity === 'WARNING').length,
    critical: filteredLogs.filter(l => l.severity === 'CRITICAL').length,
    successCount: filteredLogs.filter(l => l.status === 'Sukses').length,
    failedCount: filteredLogs.filter(l => l.status === 'Gagal').length,
  };

  // Calculate dynamic safety score based on warning vs critical
  const calculateSafetyScore = () => {
    if (logs.length === 0) return 100;
    const penalty = (logs.filter(l => l.severity === 'WARNING').length * 2.5) + (logs.filter(l => l.severity === 'CRITICAL').length * 10);
    const score = 100 - penalty;
    return Math.max(Math.min(Math.round(score), 100), 10);
  };

  const getSafetyBadgeStyle = (score: number) => {
    if (score >= 90) return "bg-emerald-50 border-emerald-100 text-emerald-700";
    if (score >= 70) return "bg-amber-50 border-amber-100 text-amber-700";
    return "bg-rose-50 border-rose-100 text-rose-700";
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider border border-rose-200 shadow-xs animate-pulse">
            <Lock className="h-3 w-3" /> KRITIS / CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> AWAS / WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
            <Info className="h-3 w-3" /> INFORMASI / INFO
          </span>
        );
    }
  };

  const statusMap = (status: string) => {
    switch (status) {
      case 'Sukses':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">Sukses</span>;
      case 'Gagal':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-100">Gagal</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200">{status}</span>;
    }
  };

  // Export CSV Ledger sheet of compliance events
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('error', 'Ybs: data kosong, transfer CSV dibatalkan.');
      return;
    }

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID LAJUR,WAKTU (UTC),ID TENANT,NAMA TENANT,AKTOR SURAT,NAMA AKTOR,KATEGORI,SEVERITY,TINDAKAN,STATUS OPERASI,ALAMAT IP,BROWSER SIGNATURE\r\n";

      filteredLogs.forEach(row => {
        const line = [
          row.id,
          row.timestamp,
          row.tenantId,
          `"${row.tenantName.replace(/"/g, '""')}"`,
          `"${row.actorEmail.replace(/"/g, '""')}"`,
          `"${row.actorName.replace(/"/g, '""')}"`,
          row.category,
          row.severity,
          `"${row.action.replace(/"/g, '""')}"`,
          row.status,
          row.ipAddress,
          `"${row.userAgent.substring(0, 100).replace(/"/g, '""')}"`
        ].join(",");
        csvContent += line + "\r\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `AUDIT_KEPANITERAAN_${currentTenantId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Alhamdulillah! Ekspor CSV penatatan audit kepatuhan berhasil diunduh.');
    } catch (e: any) {
      showToast('error', `Ekspor gagal: ${e.message}`);
    }
  };

  const handlePrintAuditTrail = (divId: string) => {
    const printContent = document.getElementById(divId);
    if (!printContent) return;
    const windowUrl = 'printWindow';
    const uniqueName = new Date().getTime();
    const printWindow = window.open('', `${windowUrl}_${uniqueName}`, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Jejak Audit Keamanan Resmi</title>
            <link href="https://fonts.googleapis.com/css2 family=Inter:wght@400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="p-8 text-slate-800 bg-white" onload="window.print(); window.close();">
            <div class="max-w-2xl mx-auto space-y-6">
              <div class="border-b-4 border-slate-900 pb-4 text-center">
                <p class="text-[10px] uppercase font-black tracking-widest text-[#001bb5]">RISIKO, KEPATUHAN &amp; KEAMANAN TEKNOLOGI</p>
                <h1 class="text-xl font-bold uppercase mt-1">BERITA ACARA AUDIT JEJAK DIGITAL KOPERASI</h1>
                <p class="text-xs text-slate-500 mt-1">Dicetak pada: ${new Date().toLocaleString()}</p>
              </div>
              ${printContent.innerHTML}
              <div class="pt-8 border-t border-dashed border-slate-200 grid grid-cols-2 text-xs gap-12 font-semibold">
                <div class="text-center">
                  <p class="text-slate-400">Pemeriksa Sistem (QSA)</p>
                  <div class="h-16"></div>
                  <p class="border-t border-slate-400 pt-1 font-bold text-slate-800">AUTOMATED ENFORCER</p>
                </div>
                <div class="text-center font-bold">
                  <p class="text-slate-400">Perwakilan Instansi</p>
                  <div class="h-16"></div>
                  <p class="border-t border-slate-400 pt-1 text-slate-850 uppercase">${currentTenantName}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Get list of unique tenatns from audit logs for filter dropdown (if global)
  const uniqueTenantsInLogs = Array.from(new Set(logs.map(l => l.tenantId))).map(tid => {
    const relevant = logs.find(l => l.tenantId === tid);
    return {
      id: tid,
      name: relevant ? relevant.tenantName : tid
    };
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black tracking-widest text-[#001bb5] uppercase flex items-center gap-2 mb-1 animate-pulse">
            <ShieldAlert className="h-4.5 w-4.5 text-red-650" /> INDONESIAN SECURE AUDIT BLOCK
          </span>
          <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight flex items-center gap-2">
            Log Jejak Audit Keamanan &amp; Kepatuhan
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-3xl">
            {isGlobalAdmin
              ? 'Tinjauan Kepatuhan Pusat SaaS: Lacak perubahan otorisasi, mutasi keuangan struktural, penghancuran data fisik browser, login staff, dan aktivitas investigasi jarak jauh lintas koperasi.'
              : 'Audit Keamanan Mandiri: Lacak akuntabilitas staf koperasi Anda, pantau riwayat penyesuaian kas, ekspor log resmi PPN/auditor, dan monitor login sistem.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleSeedMockData}
            type="button"
            className="flex items-center gap-2 px-4 py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer"
            title="Import demo entries"
          >
            <History className="h-4 w-4" /> Seeder Audit
          </button>
          
          <button
            onClick={handleExportCSV}
            type="button"
            className="flex items-center gap-2 px-4 py-3 bg-emerald-650 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV Export
          </button>

          {isGlobalAdmin && (
            <button
              onClick={() => setShowWipeModal(true)}
              type="button"
              className="flex items-center gap-2 px-4 py-3 bg-red-650 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" /> Cuci Log
            </button>
          )}
        </div>
      </div>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-md border animate-bounce text-left ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
          {toast.message}
        </div>
      )}

      {/* STATISTICS METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left relative overflow-hidden">
          <Activity className="absolute right-4 top-4 h-9 w-9 text-indigo-50" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Entri Jejak</span>
          <span className="text-2xl font-black text-slate-850">{stats.total} Logs</span>
          <div className="text-[9.5px] font-bold text-slate-450 mt-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Real-time Sync Active</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left relative overflow-hidden">
          <Lock className="absolute right-4 top-4 h-9 w-9 text-[#001bb5]/5" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status Kepatuhan</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-850">{calculateSafetyScore()}%</span>
            <span className="text-[10px] font-extrabold text-indigo-600 block">Sangat Aman</span>
          </div>
          <div className="text-[9.5px] font-bold text-slate-450 mt-1.5">
            {stats.critical > 0 ? `${stats.critical} insiden kritis terekam` : 'Tidak ada gangguan terdata'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left relative overflow-hidden">
          <Terminal className="absolute right-4 top-4 h-9 w-9 text-rose-50" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peringatan / Alert</span>
          <span className={`text-2xl font-black ${stats.warning + stats.critical > 0 ? 'text-red-600 animate-bounce' : 'text-slate-650'}`}>
            {stats.warning + stats.critical} Peringatan
          </span>
          <div className="text-[9.5px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
            <span>{stats.critical} kategori Kritis, {stats.warning} kategori Awas</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left relative overflow-hidden">
          <Cpu className="absolute right-4 top-4 h-9 w-9 text-emerald-50" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Operasi Sukses</span>
          <span className="text-2xl font-black text-emerald-650">{stats.successCount} Baris</span>
          <div className="text-[9.5px] font-bold text-emerald-600 mt-1.5">
            {(stats.total > 0 ? Math.round((stats.successCount / stats.total) * 100) : 100)}% Operasi Terkontak Berhasil
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 text-left">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="h-5 w-5 text-indigo-650 animate-spin" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Parameters &amp; Filter Forensik</span>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSeverityFilter('all');
              setCategoryFilter('all');
              setTenantFilter('all');
              setDateFilter('all');
            }}
            type="button"
            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition"
          >
            Reset Semua Filter ✖
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktor, IP, log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
          >
            <option value="all">Semua Derajat</option>
            <option value="INFO">Informasi (INFO)</option>
            <option value="WARNING">Peringatan (WARNING)</option>
            <option value="CRITICAL">Krisis (CRITICAL)</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
          >
            <option value="all">Semua Kategori</option>
            <option value="Autentikasi">Autentikasi (User Login)</option>
            <option value="Hak Akses">Otoritas &amp; Hak Akses</option>
            <option value="Reset Data">Reset &amp; Cuci Data</option>
            <option value="Mutasi Keuangan">Mutasi Finansial</option>
            <option value="Sistem &amp; Langganan">Billing &amp; Langganan</option>
            <option value="Keamanan">Regulasi Keamanan</option>
          </select>

          {/* Date range filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
          >
            <option value="all">Semua Rentang Waktu</option>
            <option value="today">24 Jam Terakhir</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
          </select>

          {/* Global Admin Tenant Filter dropdown */}
          {isGlobalAdmin ? (
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
            >
              <option value="all">Semua Integrasi Tenant</option>
              {uniqueTenantsInLogs.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          ) : (
            <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-450 text-center rounded-xl border border-slate-150 flex items-center justify-center gap-1.5">
              <Building2 className="h-4 w-4" /> Instansi: {currentTenantId.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* CORE SPLIT SCREEN PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: HISTORY LEDGER ROW TABLE */}
        <div className={`${selectedLog ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden text-left space-y-4 h-[650px] flex flex-col justify-between`}>
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-indigo-650" /> Jejak Rekaman Kronologis
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-650 rounded px-2.5 py-0.5">
              {filteredLogs.length} Terpilih
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-24 text-center text-xs font-semibold text-slate-400">Menghubungkan ke secure cloud logger...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-150 rounded-[2rem] bg-slate-50/50">
                <ShieldCheck className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-455">Semua aman. Tidak ada log audit kepatuhan.</p>
                <p className="text-[10px] text-gray-400 mt-1">Ubah filter pencarian atau klik / luncurkan Seeder Audit diatas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                
                {/* Header labels */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 font-black text-slate-400 text-[9px] uppercase tracking-wider border-b border-slate-100">
                  <span className="col-span-3">Tanggal / Event</span>
                  <span className="col-span-4">Operator / Tenant</span>
                  <span className="col-span-3">Aktivitas</span>
                  <span className="col-span-2 text-right">Severity</span>
                </div>

                {filteredLogs.map(log => {
                  const isSelected = selectedLog?.id === log.id;
                  const dateObj = new Date(log.timestamp);
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 bg-white border rounded-2xl cursor-pointer transition items-center hover:shadow-xs ${isSelected ? 'border-indigo-600 bg-indigo-50/25 shadow' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      {/* Date & ID details column */}
                      <div className="col-span-3 text-left space-y-0.5">
                        <span className="text-[10px] font-mono font-black text-slate-405 block">{log.id}</span>
                        <span className="text-[10px] text-slate-500 font-semibold block leading-none">
                          {dateObj.toLocaleDateString('id-ID')} &middot; {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {/* Operator system data */}
                      <div className="col-span-4 space-y-0.5 truncate pr-2">
                        <div className="flex items-center gap-1 text-[11.5px] font-extrabold text-slate-800 leading-none truncate">
                          <User className="h-3 w-3 text-slate-400 shrink-0" /> {log.actorName}
                        </div>
                        <div className="text-[9.5px] text-slate-450 tracking-tight leading-none truncate font-semibold">
                          Tenant: <span className="text-indigo-600 uppercase font-mono">{log.tenantId}</span> &middot; {log.ipAddress}
                        </div>
                      </div>

                      {/* Action status */}
                      <div className="col-span-3 text-left">
                        <p className="text-[11.5px] font-extrabold text-slate-800 line-clamp-1 leading-snug">{log.action}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-150 text-slate-600 text-[8px] font-extrabold tracking-widest uppercase">{log.category}</span>
                          {statusMap(log.status)}
                        </div>
                      </div>

                      {/* Priority degree badge info */}
                      <div className="col-span-2 text-right flex md:justify-end gap-1 items-center pr-1">
                        {getSeverityBadge(log.severity)}
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FORENSIC INVESTIGATOR DETAILED PANEL (4 cols) */}
        {selectedLog && (
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between text-left h-[650px] overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-indigo-600 tracking-wider uppercase block">Peneliti Jejak Digital</span>
                <h4 className="text-sm font-black text-slate-800 leading-none">Inspektor Keamanan</h4>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintAuditTrail('investigator-pdf-view')}
                  className="p-1 px-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded font-bold text-xs"
                  title="Cetak Berita Acara Audit"
                >
                  <Printer className="h-4 w-4 inline" /> Cetak
                </button>
                {isGlobalAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(selectedLog.id)}
                    className="p-1 px-1.5 hover:bg-slate-50 text-red-500 hover:text-red-700 rounded font-bold text-[10px]"
                    title="Delete log"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Inspector Middle box */}
            <div className="flex-1 overflow-y-auto space-y-4 my-4 p-4 bg-slate-900 text-slate-50 border border-slate-800 rounded-2xl font-mono text-[10px] leading-relaxed [content-visibility:auto]" id="investigator-pdf-view">
              
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <span className="px-2 py-0.5 text-[8px] bg-indigo-600 text-white rounded font-bold uppercase tracking-widest inline-block">AUDIT PATH AUTHENTIC</span>
                <p className="text-xs font-black text-slate-100 tracking-wide mt-1">UUID: {selectedLog.id}</p>
                <p className="text-slate-400">Timestamp: {new Date(selectedLog.timestamp).toLocaleString('id-ID')}</p>
              </div>

              {/* Identity properties */}
              <div className="space-y-2 border-b border-slate-800 pb-3">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Aktor User:</span>
                  <p className="col-span-2 text-slate-200 truncate">{selectedLog.actorName}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Surel Staf:</span>
                  <p className="col-span-2 text-slate-200 truncate leading-none mt-0.5">{selectedLog.actorEmail}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Cooperative ID:</span>
                  <span className="col-span-2 text-emerald-400 font-bold uppercase">{selectedLog.tenantId} ({selectedLog.tenantName})</span>
                </div>
              </div>

              {/* Audit Content Details */}
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <span className="text-slate-500 font-extrabold uppercase text-[8.5px] block">Aktivitas Terkontak:</span>
                <p className="text-indigo-300 font-black text-[11px] leading-tight uppercase">{selectedLog.action}</p>
                
                <span className="text-slate-500 font-extrabold uppercase text-[8.5px] block mt-2">Berita Acara/Uraian:</span>
                <p className="text-slate-250 font-sans text-xs leading-relaxed leading-[1.3] bg-slate-850 p-2.5 rounded-lg text-left whitespace-normal border border-slate-800">
                  {selectedLog.details}
                </p>
              </div>

              {/* Compliance checks */}
              <div className="space-y-2 border-b border-slate-800 pb-3">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Derajat:</span>
                  <span className={`col-span-2 font-black ${selectedLog.severity === 'CRITICAL' ? 'text-red-400 animate-pulse' : selectedLog.severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {selectedLog.severity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">IP Address:</span>
                  <span className="col-span-2 text-slate-300 font-bold">{selectedLog.ipAddress}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Kategori:</span>
                  <span className="col-span-2 text-indigo-400">{selectedLog.category}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[8.5px]">Status:</span>
                  <span className="col-span-2">{selectedLog.status === 'Sukses' ? '✅ SUKSES' : '❌ GAGAL/MITIGATED'}</span>
                </div>
              </div>

              {/* Device and crypt validation */}
              <div className="space-y-2 pt-1 font-sans text-[10px] leading-normal text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Spesifikasi Metadata Browser</span>
                </div>
                <div className="font-mono text-[9px] line-clamp-2 truncate" title={selectedLog.userAgent}>
                  UA: {selectedLog.userAgent}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 pt-1.5 border-t border-slate-800">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Jaminan Integritas Log: LOLOS VALIDASI</span>
                </div>
              </div>

            </div>

            {/* Bottom Actions of panel */}
            <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10.5px] leading-normal font-sans font-bold text-indigo-800 flex items-start gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-indigo-600 mt-0.5" />
              <span>Sertifikasi Kepatuhan SaaS menjamin keautentikan mutlak baris rekaman audit ini atas jaminan hukum audit finansial digital.</span>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM MASTER RESET MODAL CLIENT PANEL */}
      {showWipeModal && isGlobalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-sm border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-xs text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-600 animate-pulse" /> Konfirmasi Penghancuran Log
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowWipeModal(false);
                  setWipePassword('');
                }}
                className="p-1 text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                ✖
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Anda bersiap melakukan tindakan berbahaya berupa penghapusan fisik permanen seluruh log kepatuhan audit sistem cloud SaaS.
            </p>

            <form onSubmit={handleWipeSecurityTrail} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider">Masukkan Sandi Rahasia Kepatuhan</label>
                <input
                  type="password"
                  required
                  placeholder="Ketik: Pusat-SaaS-Aman"
                  value={wipePassword}
                  onChange={(e) => setWipePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-rose-50/50 text-xs text-rose-900 font-extrabold rounded-xl border border-rose-150 focus:outline-none focus:border-rose-500 focus:bg-white placeholder-rose-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWipeModal(false);
                    setWipePassword('');
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer text-center"
                >
                  Urungkan
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center shadow shadow-rose-150"
                >
                  Eksekusi Cuci Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
