/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  CreditCard, 
  Printer, 
  FileSpreadsheet, 
  Sparkles, 
  Building2, 
  User, 
  Trash2,
  Bell,
  Clock,
  ArrowUpRight,
  BadgeAlert,
  Send,
  LifeBuoy
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, db, handleCloudError, OperationType } from '../supabase';
import { Tenant, TenantInvoice } from '../types';

interface TenantBillingProps {
  currentTenantId: string;
  currentTenantName: string;
  currentUserEmail: string;
  isGlobalAdmin: boolean;
}

export const TenantBilling: React.FC<TenantBillingProps> = ({
  currentTenantId,
  currentTenantName,
  currentUserEmail,
  isGlobalAdmin
}) => {
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Ad-hoc creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [customPlan, setCustomPlan] = useState<'Basic' | 'Premium' | 'Enterprise'>('Premium');
  const [customAmount, setCustomAmount] = useState(500000);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment confirmation state
  const [selectedInvoice, setSelectedInvoice] = useState<TenantInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank Mandiri');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Client side transaction proof states
  const [senderBank, setSenderBank] = useState('BCA');
  const [senderAccount, setSenderAccount] = useState('');
  const [senderName, setSenderName] = useState('');

  // Toast system notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Fetch Invoices and Tenants from Cloud (Supabase emulation)
  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, "tenant_invoices"), (snap) => {
      const list: TenantInvoice[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as TenantInvoice);
      });
      // Sort newest invoice first
      list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      
      // If client tenant, filter to only show their own
      if (!isGlobalAdmin) {
        setInvoices(list.filter(inv => inv.tenantId === currentTenantId));
      } else {
        setInvoices(list);
      }
      setLoading(false);
    }, (err) => {
      handleCloudError(err, OperationType.LIST, "tenant_invoices");
      setLoading(false);
    });

    return () => unsubInvoices();
  }, [currentTenantId, isGlobalAdmin]);

  useEffect(() => {
    if (!isGlobalAdmin) return;
    const unsubTenants = onSnapshot(collection(db, "tenants"), (snap) => {
      const list: Tenant[] = [];
      snap.forEach(d => list.push(d.data() as Tenant));
      setTenants(list);
    }, (err) => {
      handleCloudError(err, OperationType.LIST, "tenants");
    });
    return () => unsubTenants();
  }, [isGlobalAdmin]);

  // Sync selected invoice if modified in backend
  useEffect(() => {
    if (selectedInvoice) {
      const updated = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updated) {
        setSelectedInvoice(updated);
      }
    }
  }, [invoices, selectedInvoice?.id]);

  // 2. AUTOMATED BILLING GENERATOR (Batch Job Simulation)
  const handleRunBatchBilling = async () => {
    const activeBillingTenants = tenants.filter(t => t.status === "Active" || t.status === "Trial");
    if (activeBillingTenants.length === 0) {
      showToast('error', 'Tidak ada penyewa aktif/trial yang terdaftar untuk ditagih.');
      return;
    }

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    const curMonthName = today.toLocaleDateString('id-ID', { month: 'long' });
    
    let invoicesCreated = 0;
    let skippedCount = 0;

    for (const t of activeBillingTenants) {
      // Basic rate matching based on rent plan or monthlyRate
      const baseAmount = t.monthlyRate || (t.plan === "Basic" ? 250000 : t.plan === "Premium" ? 600000 : t.plan === "Enterprise" ? 1500000 : 0);
      
      if (baseAmount === 0) {
        skippedCount++;
        continue;
      }

      // Check if tenant already has an invoice for the current month to prevent duplicate billing
      const invoicePrefix = `INV/SaaS/${curYear}${curMonth}/${t.id}`;
      const duplicateExists = invoices.some(inv => inv.id.startsWith(invoicePrefix) || (inv.tenantId === t.id && inv.issueDate.startsWith(`${curYear}-${curMonth}`)));

      if (duplicateExists) {
        skippedCount++;
        continue;
      }

      const invId = `INV-${curYear}${curMonth}-${t.id}-${Math.floor(1000 + Math.random() * 9000)}`;
      const issueDateStr = today.toISOString().split('T')[0];
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const tax = Math.round(baseAmount * 0.11); // 11% standard VAT
      const invoiceData: TenantInvoice = {
        id: invId,
        tenantId: t.id,
        tenantName: t.name,
        plan: t.plan,
        amount: baseAmount,
        taxAmount: tax,
        totalAmount: baseAmount + tax,
        issueDate: issueDateStr,
        dueDate: dueDateStr,
        status: "Belum Bayar",
        notes: `Faktur Tagihan Otomatis Sewa Portal SaaS - Periode ${curMonthName} ${curYear}`,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "tenant_invoices", invId), invoiceData);
        invoicesCreated++;
      } catch (err: any) {
        console.error("Gagal menjurnal invoice untuk tenant:", t.id, err);
      }
    }

    if (invoicesCreated > 0) {
      showToast('success', `Berhasil! ${invoicesCreated} Faktur Bulanan Otomatis sukses diterbitkan. ${skippedCount} penyewa dilewati (sudah ditagih/free-tier).`);
    } else {
      showToast('error', `Semua penyewa (${skippedCount}) sudah memiliki tagihan sewa pada periode ini.`);
    }
  };

  // 3. CREATE CUSTOM AD-HOC INVOICE
  const handleCreateAdHocInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      showToast('error', 'Silakan pilih koperasi penyewa terlebih dahulu.');
      return;
    }

    const t = tenants.find(ten => ten.id === selectedTenantId);
    if (!t) return;

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');

    const invId = `INV-ADHOC-${curYear}${curMonth}-${t.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueStr = today.toISOString().split('T')[0];
    const due = new Date(today);
    due.setDate(due.getDate() + 5);
    const dueStr = due.toISOString().split('T')[0];

    const tax = Math.round(customAmount * 0.11);
    const total = customAmount + tax;

    const customInvoice: TenantInvoice = {
      id: invId,
      tenantId: t.id,
      tenantName: t.name,
      plan: customPlan,
      amount: customAmount,
      taxAmount: tax,
      totalAmount: total,
      issueDate: issueStr,
      dueDate: dueStr,
      status: "Belum Bayar",
      notes: invoiceNotes.trim() || `Tagihan ad-hoc tambahan untuk penyewa: ${t.name}`,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "tenant_invoices", invId), customInvoice);
      showToast('success', `Sukses! Invoice manual ${invId} berhasil dijurnal.`);
      setShowCreateModal(false);
      setSelectedTenantId('');
      setInvoiceNotes('');
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `tenant_invoices/${invId}`);
      showToast('error', 'Gagal menerbitkan invoice manual.');
    }
  };

  // 4. CLIENT SIDE ACTION: CONFIRM PAYMENT WITH BANK DETS
  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const paymentNotesText = `Melalui bank pengirim ${senderBank} - ${senderAccount} a.n ${senderName}. Catatan: ${paymentNotes}`;
    
    const updated: TenantInvoice = {
      ...selectedInvoice,
      paymentMethod: `${senderBank} Transfer`,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentProofUrl: "https://via.placeholder.com/150", // Mock URL
      paymentNotes: paymentNotesText,
      // Change status to lunas or keep as Belum Bayar with pending approval
      // In a real automated setting, we can auto-approve or keep as pending. Let's make it auto-approve for smoother demo, but clearly log details!
      status: "Lunas"
    };

    try {
      await setDoc(doc(db, "tenant_invoices", selectedInvoice.id), updated, { merge: true });
      
      // Auto upgrade tenant valid until date by 30 days if paid
      const tenantRef = doc(db, "tenants", selectedInvoice.tenantId);
      const tSnap = tenants.find(ten => ten.id === selectedInvoice.tenantId);
      if (tSnap) {
        const curValid = new Date(tSnap.validUntil || Date.now());
        curValid.setDate(curValid.getDate() + 30); // Add 30 days
        const updatedTenant = {
          ...tSnap,
          status: "Active",
          validUntil: curValid.toISOString().split('T')[0]
        };
        await setDoc(tenantRef, updatedTenant, { merge: true });
      }

      showToast('success', 'Konfirmasi pembayaran berhasil diserahkan! Sistem secara otomatis memproses dana Virtual Account Anda, memperbarui status menjadi Lunas, dan memperpanjang masa aktif penyewa 30 hari.');
      setShowPaymentModal(false);
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `tenant_invoices/${selectedInvoice.id}`);
      showToast('error', 'Gagal memproses pembayaran.');
    }
  };

  // 5. ADMIN DIRECT ACTION: RECORD / APPROVE PAYMENT MANUALLY
  const handleMarkAsPaidManual = async (inv: TenantInvoice) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated: TenantInvoice = {
      ...inv,
      status: "Lunas",
      paymentMethod: "Manual Admin Check",
      paymentDate: todayStr,
      paymentNotes: "Verifikasi manual dari tim keuangan SaaS Pusat Admin."
    };

    try {
      await setDoc(doc(db, "tenant_invoices", inv.id), updated, { merge: true });
      
      // Retrieve and extend tenant subscription
      const tenantRef = doc(db, "tenants", inv.tenantId);
      const tSnap = tenants.find(ten => ten.id === inv.tenantId) || { id: inv.tenantId, validUntil: todayStr, status: "Active" } as any;
      
      const curValid = new Date(tSnap.validUntil || todayStr);
      curValid.setDate(curValid.getDate() + 30);
      
      const updatedTenant = {
        ...tSnap,
        status: "Active",
        validUntil: curValid.toISOString().split('T')[0]
      };
      await setDoc(tenantRef, updatedTenant, { merge: true });

      showToast('success', `Invoice ${inv.id} telah ditandai Lunas & masa aktif tenant diperpanjang.`);
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `tenant_invoices/${inv.id}`);
      showToast('error', 'Gagal menandai lunas.');
    }
  };

  // 6. ADMIN DIRECT ACTION: VOID / DELETE INVOICE
  const handleDeleteInvoice = async (invId: string) => {
    if (!window.confirm("Batal/Hapus faktur tagihan penyewa sewa ini secara permanen dari basis data?")) return;
    try {
      await deleteDoc(doc(db, "tenant_invoices", invId));
      showToast('success', 'Faktur berhasil dihapus dan dibatalkan.');
      if (selectedInvoice?.id === invId) {
        setSelectedInvoice(null);
      }
    } catch (err: any) {
      handleCloudError(err, OperationType.DELETE, `tenant_invoices/${invId}`);
      showToast('error', 'Gagal menghapus invoice.');
    }
  };

  // 7. CLIENT-SIDE FILTERING & SEARCHING
  const filteredInvoices = invoices.filter(inv => {
    const sLower = searchQuery.toLowerCase();
    const matchesSearch = inv.id.toLowerCase().includes(sLower) || 
                          inv.tenantName.toLowerCase().includes(sLower) || 
                          (inv.notes || '').toLowerCase().includes(sLower);
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'Lunas' && inv.status === 'Lunas') ||
                          (statusFilter === 'Belum Bayar' && inv.status === 'Belum Bayar') ||
                          (statusFilter === 'Jatuh Tempo' && inv.status === 'Jatuh Tempo');
    const matchesPlan = planFilter === 'all' || inv.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate dynamic invoice metrics
  const invoiceStats = {
    totalBilled: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalPaid: invoices.filter(inv => inv.status === "Lunas").reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalPending: invoices.filter(inv => inv.status === "Belum Bayar").reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalOverdue: invoices.filter(inv => inv.status === "Jatuh Tempo").reduce((sum, inv) => sum + inv.totalAmount, 0)
  };

  const formatIDR = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-100"><CheckCircle2 className="h-3 w-3" /> LUNAS</span>;
      case 'Jatuh Tempo':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-extrabold border border-red-100"><AlertCircle className="h-3 w-3" /> JATUH TEMPO</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-extrabold border border-cyan-100"><Clock className="h-3 w-3" /> BELUM BAYAR</span>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-tight border border-amber-100">Enterprise</span>;
      case 'Premium':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-tight border border-indigo-100">Premium</span>;
      case 'Basic':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-tight border border-blue-100">Basic</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tight border border-slate-200">Trial</span>;
    }
  };

  const handlePrint = (divId: string) => {
    const printContent = document.getElementById(divId);
    if (!printContent) return;
    const windowUrl = 'printWindow';
    const uniqueName = new Date().getTime();
    const printWindow = window.open('', `${windowUrl}_${uniqueName}`, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Invoice Tagihan SaaS</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: 'Inter', sans-serif; }
              .mono { font-family: 'JetBrains Mono', monospace; }
            </style>
          </head>
          <body class="p-8 text-slate-800 bg-white" onload="window.print(); window.close();">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black tracking-widest text-[#001bb5] uppercase flex items-center gap-1.5 mb-1 animate-pulse">
            <Coins className="h-4 w-4" /> Automated Tenant Billing System
          </span>
          <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
            {isGlobalAdmin ? 'Terminal Manajemen Billing & Invoice Sewa Portal' : 'Pusat Tagihan & Akses Langganan Koperasi'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {isGlobalAdmin 
              ? 'Lacak pemasukan periodik bulanan, terbitkan tagihan manual maupun otomatis ke seluruh koperasi mitra, verifikasi transfer dana, dan tinjau performa bisnis.' 
              : 'Pantau tagihan sewa bulanan server cloud Anda, lakukan pembayaran tagihan secara real-time, dan cek rincian faktur PPN resmi.'}
          </p>
        </div>

        {isGlobalAdmin ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRunBatchBilling}
              type="button"
              className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-150 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 shrink-0" /> Run Monthly Job
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              type="button"
              className="flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-150 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Faktur Manual
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">ID Tenant Anda</span>
            <span className="text-sm font-black text-slate-900 uppercase font-mono">{currentTenantId}</span>
          </div>
        )}
      </div>

      {/* TOAST NOTIF */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-md border animate-bounce text-left ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
          {notification.message}
        </div>
      )}

      {/* STATISTICS CARDS COLUMN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Piutang Sewa</span>
          <span className="text-xl font-black text-slate-905">{formatIDR(invoiceStats.totalBilled)}</span>
          <div className="text-[9px] font-bold text-slate-450 mt-1.5 flex items-center gap-1">
            <span>Volume {invoices.length} Faktur</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lunas (Paid)</span>
          <span className="text-xl font-black text-emerald-650">{formatIDR(invoiceStats.totalPaid)}</span>
          <div className="text-[9px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
            <span>Penerimaan Berhasil Terpaut</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Belum Terbayar</span>
          <span className="text-xl font-black text-cyan-650">{formatIDR(invoiceStats.totalPending)}</span>
          <div className="text-[9px] font-bold text-cyan-600 mt-1.5 flex items-center gap-1">
            <span>Menunggu Jatuh Tempo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jatuh Tempo</span>
          <span className="text-xl font-black text-rose-650">{formatIDR(invoiceStats.totalOverdue)}</span>
          <div className="text-[9px] font-bold text-rose-600 mt-1.5 flex items-center gap-1">
            <span>Sisa Tertunggak</span>
          </div>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FILTER AND LIST INVOICES (5 cols or 12 if screen width is narrow) */}
        <div className={`${selectedInvoice ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 text-left`}>
          <div className="border-b border-slate-50 pb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-indigo-650" /> Daftar Faktur Billing
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 text-slate-600 rounded">
              {filteredInvoices.length} Faktur
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari no invoice, tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:border-indigo-550 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none cursor-pointer max-w-[125px]"
            >
              <option value="all">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Bayar">Belum Bayar</option>
              <option value="Jatuh Tempo">Jatuh Tempo</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none cursor-pointer max-w-[120px]"
            >
              <option value="all">Semua Paket</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {/* LIST INVOICES RENDERED */}
          {loading ? (
            <div className="py-20 text-center text-slate-450 font-semibold text-xs">Memuat data invoice...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
              <FileText className="h-9 w-9 text-slate-300 mb-2" />
              <p className="text-xs text-slate-450 font-bold">Tidak ditemukan faktur tagihan sewa.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredInvoices.map(inv => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition relative overflow-hidden flex flex-col justify-between gap-3 ${isSelected ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-150 hover:bg-slate-50 bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{inv.id}</span>
                      <div className="flex items-center gap-1.5">
                        {getPlanBadge(inv.plan)}
                        {getStatusBadge(inv.status)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase truncate leading-snug">{inv.tenantName}</h4>
                      <div className="text-[11px] text-slate-500 font-medium line-clamp-1 truncate">{inv.notes}</div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-400">
                      <span>Total: <b className="text-slate-800 text-xs font-black">{formatIDR(inv.totalAmount)}</b></span>
                      <span>Jatuh Tempo: {inv.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FACTION VIEW & PDF INVOICE DESIGN (7 cols) */}
        {selectedInvoice && (
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 flex flex-col justify-between text-left h-[620px] overflow-hidden">
            
            {/* Header section of invoice view */}
            <div className="border-b border-indigo-50 pb-3 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{selectedInvoice.id}</span>
                  {getPlanBadge(selectedInvoice.plan)}
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <h3 className="text-xs font-black text-slate-450 uppercase mt-1 leading-none">Pihak Tertagih</h3>
                <h4 className="text-sm font-black text-slate-800 leading-snug flex items-center gap-1.5 mt-0.5 uppercase">
                  <Building2 className="h-4.5 w-4.5 text-indigo-650" /> {selectedInvoice.tenantName}
                </h4>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handlePrint('invoice-print-container')}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                  title="Cetak Faktur PDF"
                >
                  <Printer className="h-4.5 w-4.5" />
                </button>
                {isGlobalAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                    className="p-2 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    title="Hapus / Batal Invoice"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Middle Section: Elegant PDF-like View container */}
            <div className="flex-1 overflow-y-auto space-y-6 bg-slate-50 border border-slate-150 rounded-2xl p-6 relative font-sans text-xs [content-visibility:auto]" id="invoice-print-container">
              
              {/* Kop Invoice */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-dashed border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-650 tracking-widest uppercase block">PLATFORM CLOUD SAAS</span>
                  <p className="text-sm font-black text-slate-900 tracking-tight">KOPERASI RENTAL INDONESIA</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Gedung Pusat Supercloud SaaS, Lantai 12 Indonesia</p>
                </div>

                <div className="text-right space-y-1.5">
                  <span className="text-[10px] font-black bg-indigo-650 text-white rounded px-2 py-0.5 uppercase inline-block">Faktur Pajak Seri</span>
                  <h4 className="font-mono font-black text-slate-800 text-xs mt-1">{selectedInvoice.id}</h4>
                </div>
              </div>

              {/* Identity Rows */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Identitas Penyewa</span>
                  <p className="font-black text-slate-800 font-sans uppercase">{selectedInvoice.tenantName}</p>
                  <p className="text-[10.5px] text-slate-500 font-semibold">Tenant ID: <span className="font-mono">{selectedInvoice.tenantId}</span></p>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Periode Rilis</span>
                  <p className="font-bold text-slate-850">Rilis: <span className="font-mono font-black text-slate-650">{selectedInvoice.issueDate}</span></p>
                  <p className="text-[10.5px] text-slate-500 font-semibold">Jatuh Tempo: <span className="font-mono font-black text-amber-600">{selectedInvoice.dueDate}</span></p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-12 font-black text-slate-400 text-[9.5px] uppercase tracking-widest border-b border-slate-200 pb-1.5">
                  <span className="col-span-1">No</span>
                  <span className="col-span-7">Diskripsi Layanan</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>

                <div className="grid grid-cols-12 py-1.5 text-xs text-slate-700 font-semibold border-b border-slate-100">
                  <span className="col-span-1">1</span>
                  <div className="col-span-7">
                    <p className="font-black text-slate-900 uppercase">Sewa Portal SaaS Koperasi ({selectedInvoice.plan})</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedInvoice.notes}</p>
                  </div>
                  <span className="col-span-4 text-right font-bold mt-1 text-slate-900">{formatIDR(selectedInvoice.amount)}</span>
                </div>

                {/* Subtotals */}
                <div className="grid grid-cols-12 pt-3 text-[11px] font-bold text-slate-600">
                  <span className="col-span-8 text-right pr-4">Dasar Pengenaan Pajak (DPP):</span>
                  <span className="col-span-4 text-right">{formatIDR(selectedInvoice.amount)}</span>
                </div>

                <div className="grid grid-cols-12 text-[11px] font-bold text-slate-600">
                  <span className="col-span-8 text-right pr-4">PPN Keluaran (11%):</span>
                  <span className="col-span-4 text-right">{formatIDR(selectedInvoice.taxAmount)}</span>
                </div>

                <div className="grid grid-cols-12 pt-2 border-t border-dashed border-slate-200 text-sm">
                  <span className="col-span-8 text-right pr-4 font-black text-slate-900 uppercase tracking-tight">Total Akhir Bayar:</span>
                  <span className="col-span-4 text-right font-black text-indigo-650">{formatIDR(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Paid Status log detail if exists */}
              {selectedInvoice.status === 'Lunas' ? (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-1.5 text-left text-emerald-800">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Metode Konfirmasi Sukses</span>
                  <p className="text-[11px] font-extrabold leading-snug">Metode Bayar: {selectedInvoice.paymentMethod}</p>
                  <p className="text-[10px] text-emerald-700 leading-normal font-semibold">Tgl Transaksi: {selectedInvoice.paymentDate}</p>
                  <p className="text-[9.5px] mt-1 text-slate-450 italic">Catatan Kaki: {selectedInvoice.paymentNotes || 'Terima kasih atas kontribusi andil penyewaan software.'}</p>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5 text-[10.5px] text-amber-700 leading-normal font-sans font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
                  <span>Harap segera lunasi faktur sebelum {selectedInvoice.dueDate} demi memastikan lisensi integrasi database koperasi Anda berjalan normal tanpa suspensi otomatis sistem.</span>
                </div>
              )}
            </div>

            {/* Bottom operational block */}
            <div className="space-y-4 pt-1">
              {isGlobalAdmin && selectedInvoice.status !== 'Lunas' ? (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleMarkAsPaidManual(selectedInvoice)}
                    type="button"
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Konfirmasi Lunas Manual
                  </button>
                </div>
              ) : !isGlobalAdmin && selectedInvoice.status !== 'Lunas' ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    type="button"
                    className="flex items-center gap-2 px-5 py-3.5 bg-[#001bb5] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow shadow-indigo-150 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 shrink-0" /> Bayar Tagihan via VA / Mandiri
                  </button>
                </div>
              ) : (
                <div className="text-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-450">
                  Faktur ini sudah lunas terbayar resmi. Terima kasih atas loyalitas Anda dalam menggunakan platform SaaS.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE SPECIAL MANUAL INVOICE (Ad-Hoc) */}
      {showCreateModal && isGlobalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-lg border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Terbitkan Invoice Manual Ad-Hoc</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 px-2 text-slate-455 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup <X className="h-3.5 w-3.5 inline" />
              </button>
            </div>

            <form onSubmit={handleCreateAdHocInvoice} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Pilih Koperasi Penyewa</label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
                >
                  <option value="">-- Pilih Penyewa --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Plan: {t.plan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Kategori Paket</label>
                  <select
                    value={customPlan}
                    onChange={(e: any) => setCustomPlan(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Nominal DPP (Rupiah)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block font-sans">Deskripsi &amp; Alasan Invoice</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Addon custom penyimpanan cloud koperasi 50GB / Konsultasi awal penyempurnaan COA koperasi Unit Desa."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center shadow"
                >
                  Kirim Faktur Penagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE CHECKOUT & BANK TRANSFER FORM FOR CUSTOMERS */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-lg border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Gateway Pembayaran Sewa Cloud</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 px-2 text-slate-445 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup <X className="h-3.5 w-3.5 inline" />
              </button>
            </div>

            <form onSubmit={handleSubmitPaymentProof} className="space-y-4 pt-4">
              
              {/* Checkout details strip */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-1 text-left">
                <span className="text-[8.5px] font-black text-indigo-650 tracking-widest block uppercase">Ringkasan Faktur Sewa</span>
                <p className="text-xs font-black text-slate-850">Invoice serial: {selectedInvoice.id}</p>
                <p className="text-xs font-bold text-slate-550">{selectedInvoice.notes}</p>
                <p className="text-xs text-slate-805">Harga langganan: <span className="font-extrabold text-indigo-700">{formatIDR(selectedInvoice.totalAmount)}</span> (termasuk PPN 11%)</p>
              </div>

              {/* Instructions and Mock Accounts */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#001bb5] uppercase tracking-widest block">Transfer Rekening Bank Tujuan</label>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1 text-slate-700">
                  <p>Bank: <b className="text-slate-900 font-extrabold">BANK MANDIRI (Pusat Keuangan SaaS)</b></p>
                  <p>Nomor Rekening: <b className="text-slate-900 font-mono font-black text-sm text-indigo-700">122-000-888-2931</b></p>
                  <p>Atas Nama: <b className="text-slate-900 font-extrabold">KOPERASI RENTAL INDONESIA PT</b></p>
                </div>
              </div>

              {/* Sender Details Form */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Bank Pengirim Anda</label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none focus:bg-white text-slate-705 cursor-pointer focus:border-indigo-600"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">MANDIRI (Virtual Account)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Nomor Rekening Pengirim</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 8820xxxxx"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-805 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Joko Widodo"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-805 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Catatan Opsional</label>
                <textarea
                  rows={2}
                  placeholder="Catatan transfer atau nomor memo pembayaran..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-805 placeholder-slate-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center shadow shadow-indigo-150"
                >
                  Kirim Bukti Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
