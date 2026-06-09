import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { CoaAccount, CoaKategori, SaldoNormal } from '../types';

interface DataValidationEngineProps {
  coaData: CoaAccount[];
}

export function DataValidationEngine({ coaData }: DataValidationEngineProps) {
  const accountBalances = coaData.map(account => {
    const balance = account.saldoAwal || 0;
    return {
      ...account,
      balance
    };
  });

  const totalAssets = accountBalances
    .filter(a => a.kategori === CoaKategori.Aset)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accountBalances
    .filter(a => a.kategori === CoaKategori.Kewajiban)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = accountBalances
    .filter(a => a.kategori === CoaKategori.Ekuitas)
    .reduce((sum, a) => sum + a.balance, 0);

  // For Revenue and Expense, opening balances should ideally be 0 if starting a new year, 
  // but we include them in the total trial balance check.
  const totalRevenue = accountBalances
    .filter(a => a.kategori === CoaKategori.Pendapatan)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalExpense = accountBalances
    .filter(a => a.kategori === CoaKategori.Beban)
    .reduce((sum, a) => sum + a.balance, 0);

  // Accounting Equation: Assets = Liabilities + Equity
  const difference = totalAssets - (totalLiabilities + totalEquity);
  const isBalanced = Math.abs(difference) < 0.01;

  // Trial Balance Check: Debits = Credits
  const totalDebits = accountBalances
    .filter(a => a.normal === SaldoNormal.Debet)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalCredits = accountBalances
    .filter(a => a.normal === SaldoNormal.Kredit)
    .reduce((sum, a) => sum + a.balance, 0);

  const trialBalanceDiff = totalDebits - totalCredits;
  const isTrialBalanced = Math.abs(trialBalanceDiff) < 0.01;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="validation-engine">
      <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Engine Validasi Saldo Awal Neraca</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
          isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isBalanced ? 'System Balanced' : 'System Unbalanced'}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Status Indicator */}
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          isBalanced ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
        }`}>
          {isBalanced ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
          )}
          <div>
            <h4 className={`text-sm font-bold ${isBalanced ? 'text-emerald-900' : 'text-red-900'}`}>
              {isBalanced ? 'Data Saldo Awal Terverifikasi Seimbang' : 'Terdeteksi Ketidakseimbangan Saldo Awal'}
            </h4>
            <p className={`text-xs mt-1 leading-relaxed ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
              {isBalanced 
                ? 'Hasil audit menunjukkan bahwa total Aset sama dengan total Kewajiban ditambah Modal. Neraca awal Anda sudah sesuai standar akuntansi.'
                : `Ditemukan selisih sebesar ${formatCurrency(Math.abs(difference))}. Pastikan semua akun pendamping atau akun transisi telah diinput dengan benar.`}
            </p>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisi Debet (Aset)</span>
              <Scale className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(totalAssets)}</div>
            <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisi Kredit (Pasiva)</span>
              <Scale className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(totalLiabilities + totalEquity)}</div>
            <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.min(100, ((totalLiabilities + totalEquity) / (totalAssets || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Total Kewajiban (Liabilities)</span>
            <span className="font-bold text-slate-800">{formatCurrency(totalLiabilities)}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Total Modal (Equity)</span>
            <span className="font-bold text-slate-800">{formatCurrency(totalEquity)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Selisih Akhir (Mismatch)</span>
            <span className={`text-sm font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
              {isBalanced ? 'NOL (ZERO)' : formatCurrency(difference)}
            </span>
          </div>
        </div>

        {/* Action / Warning */}
        {!isBalanced && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-800 leading-tight">
              Saran: Periksa kembali akun "Saldo Laba" atau gunakan akun sementara untuk menampung selisih saldo awal hingga audit selesai.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          <RefreshCw className="h-3 w-3" /> Real-time Audit Node
        </div>
        <button 
          onClick={() => window.print()}
          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          Unduh Laporan Audit
        </button>
      </div>
    </div>
  );
}
