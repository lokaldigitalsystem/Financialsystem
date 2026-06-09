/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Download, ChevronLeft, ChevronRight, FileDown, Calendar, ArrowLeftRight } from 'lucide-react';
import { JurnalEntry, CoaAccount, SaldoNormal } from '../types';

interface BukuBesarProps {
  coaData: CoaAccount[];
  jurnalData: JurnalEntry[];
  initialAccountCode?: string;
}

export function BukuBesar(props: BukuBesarProps) {
  const [selectedAkun, setSelectedAkun] = useState<string>(props.initialAccountCode || (props.coaData.length > 0 ? props.coaData[0].kode : ""));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const targetAccount = useMemo(() => {
    return props.coaData.find(c => c.kode === selectedAkun);
  }, [props.coaData, selectedAkun]);

  // Calculate Data for the Ledger
  const ledgerData = useMemo(() => {
    if (!targetAccount) return { saldoAwal: 0, entries: [] };

    // Standard baseline saldo awal from the COA definition
    let saldoAwalSelection = targetAccount.saldoAwal || 0;
    
    // Sort all journals by date and ID to ensure consistency
    const allRelevantJournals = props.jurnalData
      .filter(j => j.akun === selectedAkun)
      .sort((a, b) => {
        const dateCompare = a.tgl.localeCompare(b.tgl);
        if (dateCompare !== 0) return dateCompare;
        return a.id.localeCompare(b.id);
      });

    const entries: {
      tgl: string;
      no: string;
      ket: string;
      debet: number;
      kredit: number;
      saldo: number;
      id: string;
    }[] = [];

    let currentRunningSaldo = saldoAwalSelection;

    allRelevantJournals.forEach(j => {
      if (targetAccount.normal === SaldoNormal.Debet) {
        currentRunningSaldo += (j.debet - j.kredit);
      } else {
        currentRunningSaldo += (j.kredit - j.debet);
      }

      entries.push({
        tgl: j.tgl,
        no: j.no,
        ket: j.ket,
        debet: j.debet,
        kredit: j.kredit,
        saldo: currentRunningSaldo,
        id: j.id
      });
    });

    // Handle initial balances for clean start cooperatives if not explicitly defined
    // In Laporan.tsx, there's a baseline logic for Jan-Apr if !isCleanSlate.
    // However, Buku Besar usually relies on actual journal entries for historical accuracy.

    // Filter by date range if provided
    let filteredEntries = entries;
    let finalSaldoAwal = saldoAwalSelection;

    if (startDate) {
      // Find entries before start date to adjust saldo awal
      const entriesBefore = entries.filter(e => e.tgl < startDate);
      if (entriesBefore.length > 0) {
        finalSaldoAwal = entriesBefore[entriesBefore.length - 1].saldo;
      }
      filteredEntries = entries.filter(e => e.tgl >= startDate);
    }
    
    if (endDate) {
      filteredEntries = filteredEntries.filter(e => e.tgl <= endDate);
    }

    return {
      saldoAwal: finalSaldoAwal,
      entries: filteredEntries
    };
  }, [targetAccount, selectedAkun, props.jurnalData, startDate, endDate]);

  const totalDebet = useMemo(() => ledgerData.entries.reduce((sum, e) => sum + e.debet, 0), [ledgerData]);
  const totalKredit = useMemo(() => ledgerData.entries.reduce((sum, e) => sum + e.kredit, 0), [ledgerData]);
  
  const totalPages = Math.ceil(ledgerData.entries.length / pageSize) || 1;
  const paginatedEntries = ledgerData.entries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Buku Besar - ${targetAccount?.kode} ${targetAccount?.nama}\r\n`;
    csvContent += `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}\r\n\r\n`;
    csvContent += "Tanggal,No. Bukti,Keterangan,Debet,Kredit,Saldo Berjalan\r\n";
    
    csvContent += `,,SALDO AWAL,,,${ledgerData.saldoAwal}\r\n`;
    
    ledgerData.entries.forEach(e => {
      csvContent += `${e.tgl},${e.no},"${e.ket.replace(/"/g, '""')}",${e.debet},${e.kredit},${e.saldo}\r\n`;
    });
    
    csvContent += `,,TOTAL MUTASI,${totalDebet},${totalKredit},\r\n`;
    csvContent += `,,SALDO AKHIR,,,${ledgerData.entries.length > 0 ? ledgerData.entries[ledgerData.entries.length - 1].saldo : ledgerData.saldoAwal}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Buku_Besar_${selectedAkun}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-red-600" /> Buku Besar (General Ledger)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Analisis detail mutasi keuangan per rekening akun secara kronologis
          </p>
        </div>
        <div className="mt-4 md:mt-0">
           <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2 shadow-sm"
          >
            <FileDown className="h-4 w-4" /> Export Ledger (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pilih Rekening Akun</label>
              <select
                value={selectedAkun}
                onChange={(e) => {
                   setSelectedAkun(e.target.value);
                   setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              >
                {props.coaData.map(c => (
                  <option key={c.kode} value={c.kode}>{c.kode} — {c.nama}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-gray-50">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rentang Tanggal</label>
               <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="text-center text-[10px] text-gray-300 font-bold">s/d</div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
               </div>
               {(startDate || endDate) && (
                 <button
                   onClick={() => { setStartDate(""); setEndDate(""); setCurrentPage(1); }}
                   className="mt-3 w-full py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                 >
                   Reset Filter Tanggal
                 </button>
               )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ringkasan Saldo Akun</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Saldo Awal Periode</p>
                  <p className="font-mono text-lg font-black text-amber-400">Rp {ledgerData.saldoAwal.toLocaleString('id-ID')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                     <p className="text-[9px] text-slate-400 mb-1">Total Debet</p>
                     <p className="font-mono text-sm font-bold text-emerald-400">+{totalDebet.toLocaleString('id-ID')}</p>
                   </div>
                   <div>
                     <p className="text-[9px] text-slate-400 mb-1">Total Kredit</p>
                     <p className="font-mono text-sm font-bold text-rose-400">-{totalKredit.toLocaleString('id-ID')}</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 mb-1">Saldo Akhir Berjalan</p>
                  <p className="font-mono text-xl font-black text-white">
                    Rp {(ledgerData.entries.length > 0 ? ledgerData.entries[ledgerData.entries.length - 1].saldo : ledgerData.saldoAwal).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
            <ArrowLeftRight className="absolute -right-6 -bottom-6 h-32 w-32 text-slate-800 opacity-50" />
          </div>
        </div>

        {/* Ledger Table Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 italic">
                    <th colSpan={6} className="py-3 px-4 text-xs font-bold text-gray-500">
                      Buku Besar: <span className="text-red-600 not-italic">{targetAccount?.kode} — {targetAccount?.nama}</span>
                    </th>
                  </tr>
                  <tr className="bg-white border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No. Bukti</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debet (Rp)</th>
                    <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                    <th className="py-3 px-4 text-right bg-slate-50/50">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-50 font-medium">
                  {/* Saldo Awal Row */}
                  <tr className="bg-amber-50/30 text-amber-900 font-bold italic">
                    <td className="py-2.5 px-4">{startDate || 'Awal'}</td>
                    <td className="py-2.5 px-4">-</td>
                    <td className="py-2.5 px-4">SALDO AWAL PINDAHAN</td>
                    <td className="py-2.5 px-4 text-right font-mono">-</td>
                    <td className="py-2.5 px-4 text-right font-mono">-</td>
                    <td className="py-2.5 px-4 text-right font-mono bg-amber-50">Rp {ledgerData.saldoAwal.toLocaleString('id-ID')}</td>
                  </tr>

                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                        Tidak ada aktivitas mutasi untuk akun ini pada periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-red-50/20 transition-colors group">
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{e.tgl}</td>
                        <td className="py-3 px-4 font-bold text-gray-700">{e.no}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs">{e.ket}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {e.debet > 0 ? e.debet.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {e.kredit > 0 ? e.kredit.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-gray-900 bg-slate-50/30 group-hover:bg-red-50/50 transition-colors">
                          Rp {e.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between text-[11px]">
               <div className="flex items-center gap-2">
                 <span className="text-gray-400 font-bold uppercase tracking-tighter">Ukuran Baris:</span>
                 <select
                   className="bg-white border rounded px-1.5 py-0.5 outline-none font-medium"
                   value={pageSize}
                   onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(1);}}
                 >
                   <option value={10}>10</option>
                   <option value={25}>25</option>
                   <option value={50}>50</option>
                   <option value={100}>100</option>
                 </select>
               </div>
               
               <div className="flex items-center gap-4">
                 <span className="text-gray-500">
                   Halaman <span className="font-black text-gray-800">{currentPage}</span> / {totalPages}
                 </span>
                 <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
             <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1 italic">Verifikasi Saldo & Normalitas Akun:</h5>
             <p className="text-[11px] text-red-700 leading-relaxed font-medium">
               Akun <span className="font-bold">{targetAccount?.nama}</span> memiliki Saldo Normal di posisi <span className="font-bold underline">{targetAccount?.normal.toUpperCase()}</span>. 
               Kenaikan saldo terjadi ketika mutasi berada di sisi {targetAccount?.normal}, dan saldo akan berkurang jika terdapat mutasi di sisi sebaliknya.
               Saldo berjalan mencerminkan akumulasi akhir setalah setiap baris transaksi diproses.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
