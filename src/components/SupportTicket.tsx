/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Building2, 
  Filter, 
  X, 
  ChevronRight, 
  User, 
  FileText, 
  CornerDownRight, 
  AlertTriangle,
  History,
  Trash2,
  BookmarkCheck
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, db, handleCloudError, OperationType } from '../supabase';

export interface TicketMessage {
  id: string;
  sender: 'client' | 'admin';
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
}

export interface SupportTicketData {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  subject: string;
  category: 'Eror Teknis' | 'Akuntansi & COA' | 'Billing & Paket' | 'Pertanyaan Umum';
  priority: 'Rendah' | 'Sedang' | 'Darurat';
  status: 'Open' | 'In Progress' | 'Resolved';
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface SupportTicketProps {
  currentTenantId: string;
  currentTenantName: string;
  currentUserEmail: string;
  currentUserName: string;
  isGlobalAdmin: boolean;
}

export const SupportTicket: React.FC<SupportTicketProps> = ({
  currentTenantId,
  currentTenantName,
  currentUserEmail,
  currentUserName,
  isGlobalAdmin
}) => {
  const [tickets, setTickets] = useState<SupportTicketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Eror Teknis' | 'Akuntansi & COA' | 'Billing & Paket' | 'Pertanyaan Umum'>('Pertanyaan Umum');
  const [newPriority, setNewPriority] = useState<'Rendah' | 'Sedang' | 'Darurat'>('Sedang');
  const [newDescription, setNewDescription] = useState('');

  // Selected Ticket/Conversation view state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketData | null>(null);
  const [newMessageText, setNewMessageText] = useState('');

  // Toast / System Notifications state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Real-time listener for support tickets (Global collections to allow admins to see everything)
  useEffect(() => {
    const unsubTickets = onSnapshot(collection(db, "support_tickets"), (snap) => {
      const list: SupportTicketData[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SupportTicketData);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      // Filter list immediately if client (non-admin can only see their cooperative tickets)
      if (!isGlobalAdmin) {
        const clientList = list.filter(t => t.tenantId === currentTenantId);
        setTickets(clientList);
      } else {
        setTickets(list);
      }
      setLoading(false);
    }, (err) => {
      handleCloudError(err, OperationType.LIST, "support_tickets");
      setLoading(false);
    });

    return () => unsubTickets();
  }, [currentTenantId, isGlobalAdmin]);

  // Sync selected ticket details if modified in backend
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets, selectedTicket?.id]);

  // Create new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('error', 'Harap isi subjek dan detail penjelasan pengaduan.');
      return;
    }

    const ticketId = 'ticket_' + Math.random().toString(36).substring(2, 11);
    const dateStr = new Date().toISOString();

    const newTicket: SupportTicketData = {
      id: ticketId,
      tenantId: currentTenantId || 'Supercloud',
      tenantName: currentTenantName || 'Sistem Utama',
      tenantEmail: currentUserEmail || 'unknown@domain.com',
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      description: newDescription.trim(),
      createdAt: dateStr,
      updatedAt: dateStr,
      messages: [
        {
          id: 'msg_init_' + Math.random().toString(36).substring(2, 9),
          sender: 'client',
          senderName: currentUserName || 'Konsumen Koperasi',
          senderEmail: currentUserEmail,
          message: newDescription.trim(),
          createdAt: dateStr
        }
      ]
    };

    try {
      await setDoc(doc(db, "support_tickets", ticketId), newTicket);
      showToast('success', `Tiket bantuan "${newSubject}" berhasil diajukan! Tim dukungan akan memproses segera.`);
      // Clear forms
      setNewSubject('');
      setNewDescription('');
      setNewCategory('Pertanyaan Umum');
      setNewPriority('Sedang');
      setShowCreateModal(false);
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `support_tickets/${ticketId}`);
      showToast('error', 'Gagal mengajukan tiket bantuan: ' + err.message);
    }
  };

  // Delete/Archive Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tiket bantuan ini secara permanen dari database?")) return;
    try {
      await deleteDoc(doc(db, "support_tickets", ticketId));
      showToast('success', "Tiket bantuan berhasil dieliminasi.");
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err: any) {
      handleCloudError(err, OperationType.DELETE, `support_tickets/${ticketId}`);
      showToast('error', "Gagal menghapus tiket.");
    }
  };

  // Reply to ticket (add message)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedTicket) return;

    const dateStr = new Date().toISOString();
    const senderRole = isGlobalAdmin ? 'admin' : 'client';
    const senderName = isGlobalAdmin ? 'SaaS System support' : (currentUserName || 'Koperasi Admin');

    const newMsg: TicketMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sender: senderRole,
      senderName,
      senderEmail: currentUserEmail,
      message: newMessageText.trim(),
      createdAt: dateStr
    };

    const updatedTicket: SupportTicketData = {
      ...selectedTicket,
      updatedAt: dateStr,
      // Auto upgrade open status to progress if admin replies
      status: (isGlobalAdmin && selectedTicket.status === 'Open') ? 'In Progress' : selectedTicket.status,
      messages: [...selectedTicket.messages, newMsg]
    };

    try {
      await setDoc(doc(db, "support_tickets", selectedTicket.id), updatedTicket, { merge: true });
      setNewMessageText('');
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `support_tickets/${selectedTicket.id}`);
      showToast('error', "Gagal mengirim tanggapan.");
    }
  };

  // Change Ticket Status Directly
  const handleUpdateStatus = async (status: 'Open' | 'In Progress' | 'Resolved') => {
    if (!selectedTicket) return;
    const dateStr = new Date().toISOString();
    const updatedTicket: SupportTicketData = {
      ...selectedTicket,
      status,
      updatedAt: dateStr
    };

    try {
      await setDoc(doc(db, "support_tickets", selectedTicket.id), updatedTicket, { merge: true });
      showToast('success', `Status tiket berhasil diubah menjadi "${status}"`);
    } catch (err: any) {
      handleCloudError(err, OperationType.WRITE, `support_tickets/${selectedTicket.id}`);
      showToast('error', "Gagal mengubah status tiket.");
    }
  };

  // Client side filters
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      t.subject.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower) ||
      t.tenantName.toLowerCase().includes(searchLower) ||
      t.id.toLowerCase().includes(searchLower);

    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Count Stats
  const ticketCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Darurat':
        return <span className="inline-flex px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-tight border border-rose-100 animate-pulse">Darurat</span>;
      case 'Sedang':
        return <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-tight border border-amber-100">Sedang</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight border border-slate-200">Rendah</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-105"><Clock className="h-3 w-3" /> OPEN</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-55 text-amber-700 text-[10px] font-extrabold border border-amber-200"><MessageSquare className="h-3 w-3" /> PROSES</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-105"><CheckCircle2 className="h-3 w-3" /> SELESAI</span>;
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase flex items-center gap-1.5 mb-1">
            <LifeBuoy className="h-4 w-4 animate-spin" /> {isGlobalAdmin ? 'Pusat Kontrol SaaS' : 'Layanan Konsumen & Bantuan'}
          </span>
          <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
            {isGlobalAdmin ? 'Sistem Manajemen Tiket Bantuan & Pengaduan' : 'Pengaduan & Tiket Layanan Mandiri'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {isGlobalAdmin 
              ? 'Tinjau, jawab, prioritaskan, dan selesaikan seluruh kendala sistem, pertanyaan billing, serta keluhan operasional dari penyewa secara holistik.' 
              : 'Ajukan pertanyaan koordinasi COA buku besar, laporkan eror sistem akuntansi, atau laporkan kendala operasional harian koperasi Anda langsung ke tim developer SaaS.'}
          </p>
        </div>
        
        {!isGlobalAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-150 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Buka Tiket Baru
          </button>
        )}
      </div>

      {/* TOAST SYSTEM */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs font-bold font-sans shadow-md border animate-bounce ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {notification.message}
        </div>
      )}

      {/* THREE STRIPS BOX STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${statusFilter === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'}`}
        >
          <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>Semua Tiket</span>
          <span className="text-2xl font-black">{ticketCounts.all} rec</span>
        </button>

        <button 
          onClick={() => setStatusFilter('Open')}
          className={`p-4 rounded-2xl border text-left transition ${statusFilter === 'Open' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'}`}
        >
          <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${statusFilter === 'Open' ? 'text-blue-100' : 'text-slate-400'}`}>Berstatus Baru (Open)</span>
          <span className="text-2xl font-black">{ticketCounts.open} rec</span>
        </button>

        <button 
          onClick={() => setStatusFilter('In Progress')}
          className={`p-4 rounded-2xl border text-left transition ${statusFilter === 'In Progress' ? 'bg-amber-500 border-amber-505 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'}`}
        >
          <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${statusFilter === 'In Progress' ? 'text-amber-50' : 'text-slate-400'}`}>Sistem Diproses (Progress)</span>
          <span className="text-2xl font-black">{ticketCounts.progress} rec</span>
        </button>

        <button 
          onClick={() => setStatusFilter('Resolved')}
          className={`p-4 rounded-2xl border text-left transition ${statusFilter === 'Resolved' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-705 hover:border-slate-200'}`}
        >
          <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${statusFilter === 'Resolved' ? 'text-emerald-100' : 'text-slate-400'}`}>Selesai Ditangani</span>
          <span className="text-2xl font-black">{ticketCounts.resolved} rec</span>
        </button>
      </div>

      {/* CORE DISPLAY COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FILTERING & TICKET LIST (5 cols or 12 if screen width is narrow) */}
        <div className={`${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 text-left`}>
          <div className="border-b border-slate-50 pb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" /> Daftar Rekaman Tiket
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 text-slate-600 rounded">Menampilkan {filteredTickets.length} Tiket</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari subjek, isi tiket, tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
              />
            </div>
            {/* Category selection */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none text-slate-705 cursor-pointer max-w-[150px]"
            >
              <option value="all">Semua Kategori</option>
              <option value="Eror Teknis">Eror Teknis</option>
              <option value="Akuntansi & COA">Akuntansi & COA</option>
              <option value="Billing & Paket">Billing & Paket</option>
              <option value="Pertanyaan Umum">Pertanyaan Umum</option>
            </select>

            {/* Priority selection */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none text-slate-705 cursor-pointer max-w-[150px]"
            >
              <option value="all">Semua Prioritas</option>
              <option value="Darurat">Prioritas Darurat</option>
              <option value="Sedang">Prioritas Sedang</option>
              <option value="Rendah">Prioritas Rendah</option>
            </select>
          </div>

          {/* Ticket lists view */}
          {loading ? (
            <div className="py-20 text-center text-slate-450 font-semibold text-xs">Memuat data tiket...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
              <History className="h-9 w-9 text-slate-300 mb-2.5" />
              <p className="text-xs text-slate-450 font-bold">Tidak ditemukan log tiket bantuan.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {filteredTickets.map(t => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-150 hover:bg-slate-50 bg-white'}`}
                  >
                    {t.priority === 'Darurat' && (
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-red-600 animate-pulse" />
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{t.id}</span>
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(t.priority)}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1 truncate uppercase">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{t.tenantName}</span>
                      </div>
                      <span>{formatDate(t.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION DISCUSSIONS PANEL (7 cols) */}
        {selectedTicket && (
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 flex flex-col justify-between text-left h-[620px] overflow-hidden" id="ticket-chat-frame">
            
            {/* Thread Header */}
            <div className="border-b border-slate-100 pb-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{selectedTicket.id}</span>
                  <span className="text-xs font-bold text-slate-500 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg">{selectedTicket.category}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight mt-1">{selectedTicket.subject}</h3>
                <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-405" /> {selectedTicket.tenantName} ({selectedTicket.tenantEmail})
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isGlobalAdmin && (
                  <button 
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-2 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    title="Hapus / Tutup Tiket Permanen"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Stream (Scrolled container) */}
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 my-2 border-b border-slate-100">
              {/* Init description container */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pengaduan Awal</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.description}</p>
                <div className="text-[9.5px] font-mono font-bold text-slate-400 mt-2 flex items-center gap-1">
                  <span>Diajukan oleh:</span>
                  <span className="text-indigo-600">{selectedTicket.tenantName}</span>
                  <span>&bull;</span>
                  <span>{formatDate(selectedTicket.createdAt)}</span>
                </div>
              </div>

              {/* Chat Thread Messages bubble list */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m, idx) => {
                  const isAdminMsg = m.sender === 'admin';
                  return (
                    <div 
                      key={m.id || idx} 
                      className={`flex flex-col max-w-[85%] my-1.5 text-left ${isAdminMsg ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-slate-500">{m.senderName}</span>
                        {isAdminMsg && <span className="text-[8.5px] font-black text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded uppercase border border-indigo-150">SUPPORT TEAM</span>}
                      </div>
                      
                      <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed whitespace-pre-wrap ${isAdminMsg ? 'bg-indigo-600 text-white border border-transparent rounded-tr-none shadow-sm' : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none'}`}>
                        {m.message}
                      </div>

                      <span className="text-[9px] font-bold text-slate-400 mt-1 font-mono">{formatDate(m.createdAt)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">Belum ada percakapan responsif.</div>
              )}
            </div>

            {/* Bottom Actions Form (Admin changes status / user chat replies) */}
            <div className="space-y-4">
              
              {/* Admin Operational Actions: Status and Fast Toggle */}
              {isGlobalAdmin && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                    <BookmarkCheck className="h-4 w-4 text-emerald-600" /> Manajemen Status Tiket
                  </span>
                  
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('Open')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer ${selectedTicket.status === 'Open' ? 'bg-blue-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Buka Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('In Progress')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer ${selectedTicket.status === 'In Progress' ? 'bg-amber-500 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Mulai Proses
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('Resolved')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer ${selectedTicket.status === 'Resolved' ? 'bg-emerald-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tandai Selesai
                    </button>
                  </div>
                </div>
              )}

              {/* Client Operational Actions (Resolved status option) */}
              {!isGlobalAdmin && selectedTicket.status !== 'Resolved' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Tandai pengaduan bantuan ini sudah selesai teratasi?")) {
                        handleUpdateStatus('Resolved');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Tandai Masalah Selesai
                  </button>
                </div>
              )}

              {/* Send Chat input form block */}
              {selectedTicket.status === 'Resolved' && !isGlobalAdmin ? (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-650" /> Tiket ini sudah berstatus Selesai (RESOLVED). Klik "Buka Kembali" atau ajukan tiket baru bila kendala berulang.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={isGlobalAdmin ? "Ketik jawaban admin solutif kami..." : "Ketik balasan / tanggapan tambahan Anda..."}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-150 text-xs font-semibold rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-lg border border-slate-100 divide-y divide-slate-100 animate-in zoom-in-95 duration-200 text-left">
            
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-red-650 animate-bounce" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Ajukan Tiket Pengaduan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 px-2 text-slate-450 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup <X className="h-3.5 w-3.5 inline" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 pt-4">
              
              {/* Category and priority selection fields in row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Kategori Kendala</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none text-slate-705 cursor-pointer focus:bg-white focus:border-indigo-600"
                  >
                    <option value="Eror Teknis">Eror Teknis Sistem</option>
                    <option value="Akuntansi & COA">Akuntansi &amp; COA</option>
                    <option value="Billing & Paket">Billing &amp; Paket Sewa</option>
                    <option value="Pertanyaan Umum">Pertanyaan Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Tingkat Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-150 focus:outline-none text-slate-705 cursor-pointer focus:bg-white focus:border-indigo-600"
                  >
                    <option value="Rendah">Rendah (Pertanyaan/Saran)</option>
                    <option value="Sedang">Sedang (Ada Kendala Kecil)</option>
                    <option value="Darurat">Darurat (Sistem Lumpuh)</option>
                  </select>
                </div>
              </div>

              {/* Subject of ticket */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Judul / Subjek Pengaduan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kode perkiraan akun piutang pupuk tidak seimbang"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Detailed description description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Keluhan / Detail Penjelasan Kendala</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Jelaskan secara runtut mengenai permasalahan Anda. Tambahkan nominal atau detail spesifik jika perlu."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-150 focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Warnings/Accents */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2 text-[11px] text-amber-700 leading-normal font-sans">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 animate-bounce mt-0.5" />
                <span>Kendala Anda akan direkam secara real-time di pangkalan pusat tim pendukung SaaS. Kami berkomitmen memberikan tanggapan maksimal 1 x 24 jam.</span>
              </div>

              {/* Submit Buttons */}
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
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center shadow-lg shadow-red-150"
                >
                  Kirim Pengaduan Bantuan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
