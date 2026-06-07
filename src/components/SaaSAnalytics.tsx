/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Percent, 
  PiggyBank, 
  ArrowUpRight, 
  BarChart3, 
  PieChart, 
  Info, 
  Calendar,
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  Calculator,
  Zap,
  Target,
  Activity,
  History
} from 'lucide-react';
import { Tenant } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell
} from 'recharts';

interface SaaSAnalyticsProps {
  tenants: Tenant[];
}

export const SaaSAnalytics: React.FC<SaaSAnalyticsProps> = ({ tenants }) => {
  // Simulator configuration states
  const [churnRate, setChurnRate] = useState<number>(5); // Default 5% MoM churn
  const [estimatedCAC, setEstimatedCAC] = useState<number>(1500000); // Default CAC Rp 1,500,000
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState<number>(10); // Default 10% projection growth
  const [projectionMonths, setProjectionMonths] = useState<number>(12); // Default 12 months

  // Heatmap helper: Generate deterministic activity intensity for the last 30 days
  const generateHeatmapData = () => {
    const days = 30;
    return tenants.slice(0, 12).map(tenant => {
      const activityData = Array.from({ length: days }, (_, i) => {
        // Deterministic but random-looking activity based on tenant ID and day index
        const seed = (tenant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + i) % 10;
        const baseActivity = tenant.plan === "Premium" ? 3 : tenant.plan === "Enterprise" ? 6 : 1;
        const intensity = Math.min(10, Math.max(0, baseActivity + (seed % 5) - 2));
        return intensity;
      });
      return {
        id: tenant.id,
        name: tenant.name,
        activity: activityData
      };
    });
  };

  const heatmapData = generateHeatmapData();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const getHeatmapColor = (intensity: number) => {
    if (intensity === 0) return "bg-slate-50";
    if (intensity < 2) return "bg-indigo-100";
    if (intensity < 4) return "bg-indigo-300";
    if (intensity < 6) return "bg-indigo-500";
    if (intensity < 8) return "bg-indigo-700";
    return "bg-indigo-900";
  };

  // 1. FILTERING & BASIS METRICS
  const activeAndTrialTenants = tenants.filter(t => t.status === "Active" || t.status === "Trial");
  const paidTenants = tenants.filter(t => t.status === "Active" && (t.plan === "Basic" || t.plan === "Premium" || t.plan === "Enterprise"));
  
  // Calculate real Monthly Recurring Revenue (MRR)
  const realMRR = paidTenants.reduce((sum, t) => sum + (t.monthlyRate || 0), 0);
  const realARR = realMRR * 12;

  // Active paid counts
  const totalPaidCount = paidTenants.length;
  const trialCount = tenants.filter(t => t.status === "Trial" || t.plan === "Trial").length;

  // ARPU (Average Revenue Per User)
  const realARPU = totalPaidCount > 0 ? Math.round(realMRR / totalPaidCount) : 0;

  // SaaS Logic formulas
  // LTV = ARPU / Churn Rate
  const churnDecimal = churnRate / 100;
  const estimatedLTV = churnDecimal > 0 ? Math.round(realARPU / churnDecimal) : 0;

  // LTV : CAC Ratio
  const ltvToCacRatio = estimatedCAC > 0 ? (estimatedLTV / estimatedCAC) : 0;

  // Payback period (CAC / ARPU) in months
  const paybackPeriodMonths = realARPU > 0 ? (estimatedCAC / realARPU).toFixed(1) : '∞';

  // 2. DATA BREAKDOWN BY TIER / PLAN
  const planStats = {
    Basic: { count: 0, revenue: 0 },
    Premium: { count: 0, revenue: 0 },
    Enterprise: { count: 0, revenue: 0 },
    Trial: { count: 0, revenue: 0 },
  };

  tenants.forEach(t => {
    const plan = t.plan || "Trial";
    if (planStats[plan]) {
      planStats[plan].count += 1;
      if (t.status === "Active") {
        planStats[plan].revenue += (t.monthlyRate || 0);
      }
    }
  });

  const planChartData = [
    { name: 'Basic', Tenants: planStats.Basic.count, Revenue: planStats.Basic.revenue, fill: '#3b82f6' },
    { name: 'Premium', Tenants: planStats.Premium.count, Revenue: planStats.Premium.revenue, fill: '#6366f1' },
    { name: 'Enterprise', Tenants: planStats.Enterprise.count, Revenue: planStats.Enterprise.revenue, fill: '#f59e0b' },
    { name: 'Trial/Demo', Tenants: planStats.Trial.count, Revenue: 0, fill: '#94a3b8' }
  ];

  // 3. GENERATE GROWTH PROJECTIONS BASED ON USER SLIDERS
  // Calculate MoM compounding trajectory
  const compoundProjData = Array.from({ length: projectionMonths }, (_, index) => {
    const monthIndex = index + 1;
    // Compounding formula: MRR * (1 + growth - churn)^month
    const compoundGrowthDecimal = monthlyGrowthRate / 100;
    const netGrowthRateCompounded = Math.max(-0.9, compoundGrowthDecimal - churnDecimal);
    const projectedMRRVal = realMRR * Math.pow(1 + netGrowthRateCompounded, index);
    const projectedARRVal = projectedMRRVal * 12;

    return {
      name: `Bulan ${monthIndex}`,
      MRR: Math.round(projectedMRRVal),
      ARR: Math.round(projectedARRVal),
    };
  });

  // Color matching block for CAC indicator
  const getRatioStatus = (ratio: number) => {
    if (ratio >= 3) return { text: "Sangat Sehat (Excellent)", color: "text-emerald-600 bg-emerald-55", border: "border-emerald-200" };
    if (ratio >= 1.5) return { text: "Sehat (Good)", color: "text-amber-600 bg-amber-55", border: "border-amber-200" };
    if (ratio > 0) return { text: "Rasio Khawatir (Unstable)", color: "text-rose-600 bg-rose-55", border: "border-rose-200" };
    return { text: "Belum Ada Model", color: "text-slate-500 bg-slate-55", border: "border-slate-200" };
  };

  const ratioInfo = getRatioStatus(ltvToCacRatio);

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-305 text-left">
      {/* 1. TOP METRIC STRIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monthly Recurring (MRR)</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Coins className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{formatIDR(realMRR)}</div>
            <p className="text-[10.5px] text-slate-500 mt-2 font-medium flex items-center gap-1">
              <span className="text-emerald-600 font-extrabold flex items-center">&bull;</span>
              Aktif berlangganan dari {totalPaidCount} penyewa
            </p>
          </div>
        </div>

        {/* ARR CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Annual Run Rate (ARR)</span>
              <div className="p-2 bg-emerald-50 text-emerald-650 rounded-xl">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{formatIDR(realARR)}</div>
            <p className="text-[10.5px] text-slate-500 mt-2 font-medium">
              Ekstrapolasi billing 12 bulan mendatang
            </p>
          </div>
        </div>

        {/* ARPU CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avg Revenue per Tenant (ARPU)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{formatIDR(realARPU)}</div>
            <p className="text-[10.5px] text-slate-500 mt-2 font-medium">
              Rata-rata tarif per penyewa aktif
            </p>
          </div>
        </div>

        {/* TRIAL CONVERSION CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conversions &amp; Trials</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Percent className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-955 leading-none">
              {tenants.length > 0 ? ((totalPaidCount / tenants.length) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-[10.5px] text-slate-500 mt-2 font-medium flex items-center gap-1.5">
              <span>{trialCount} Tenant sedang masa evaluasi (Trial)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. DUAL COLUMNS: ANALYTICS SLIDERS vs MODEL FORECASTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SLIDERS PANEL (4 columns) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">SaaS Diagnostic Sim</h3>
          </div>

          {/* CHURN RATE SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-600">Model Churn Rate (MoM)</label>
              <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px]">{churnRate}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="0.5"
              value={churnRate}
              onChange={(e) => setChurnRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
            <p className="text-[9.5px] text-slate-400 leading-tight">Persentase prakiraan pembatasan/pembatalan kontrak sewa sebulan.</p>
          </div>

          {/* CAC SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-600">Acquisition Cost (CAC)</label>
              <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px]">{formatIDR(estimatedCAC)}</span>
            </div>
            <input 
              type="range" 
              min="100000" 
              max="10000000" 
              step="100000"
              value={estimatedCAC}
              onChange={(e) => setEstimatedCAC(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
            <p className="text-[9.5px] text-slate-400 leading-tight">Rata-rata modal pemasaran untuk merekrut 1 penyewa baru.</p>
          </div>

          {/* COMPANDING GROWTHMoM SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-600">Prakiraan Growth MoM</label>
              <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px]">{monthlyGrowthRate}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              value={monthlyGrowthRate}
              onChange={(e) => setMonthlyGrowthRate(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
            <p className="text-[9.5px] text-slate-400 leading-tight">Kecepatan penetrasi pasar bulanan &amp; perolehan rental.</p>
          </div>

          {/* COMPOUNDING TIMESPAN SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-600">Rentang Prospektif</label>
              <span className="font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px]">{projectionMonths} Bulan</span>
            </div>
            <input 
              type="range" 
              min="6" 
              max="24" 
              step="3"
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* FORMULATED FORECASTING METRICS (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LTV TELEMETRY */}
            <div className="md:border-r md:border-slate-105 pr-2 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <PiggyBank className="h-3.5 w-3.5 text-indigo-500" />
                Customer Lifetime Value
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{formatIDR(estimatedLTV)}</div>
                <p className="text-[9.5px] text-slate-500 mt-1 leading-normal">
                  Prakiraan total pemasukan dari satu penyewa hingga putus kontrak (LTV = ARPU / Churn).
                </p>
              </div>
            </div>

            {/* CAC COHESION RATIO */}
            <div className="md:border-r md:border-slate-105 pr-2 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Target className="h-3.5 w-3.5 text-indigo-550" />
                LTV : CAC Cohesion Ratio
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                  {ltvToCacRatio.toFixed(2)}x
                  <span className="text-xs font-bold text-slate-400">Ratio</span>
                </div>
                <div className="mt-1.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border ${ratioInfo.color} ${ratioInfo.border}`}>
                    {ratioInfo.text}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYBACK TIMELINE */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Calculator className="h-3.5 w-3.5 text-amber-500" />
                Titik Impas CAC (Payback)
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                  {paybackPeriodMonths}
                  <span className="text-xs font-bold text-slate-400">Bulan</span>
                </div>
                <p className="text-[9.5px] text-slate-500 mt-1 leading-normal">
                  Waktu yang dibutuhkan satu penyewa untuk membayar kembali biaya akuisisinya.
                </p>
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC GRAPH ADVISER BANNER */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex items-start gap-4 shadow-xl">
            <Zap className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-left space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-400">SaaS Business Analytics Insights</p>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {ltvToCacRatio >= 3 ? (
                  `Kondisi finansial SaaS Anda sangat eksklusif! Rasio LTV:CAC saat ini (${ltvToCacRatio.toFixed(1)}x) berada di atas benchmark emas industri (3.0x). Ini menandakan nilai seumur hidup pelanggan jauh lebih tinggi daripada modal pemasaran Anda. Anda direkomendasikan meningkatkan modal marketing untuk merekrut penyewa secara masif.`
                ) : ltvToCacRatio >= 1 ? (
                  `Efisiensi bisnis SaaS Anda tergolong moderat (${ltvToCacRatio.toFixed(1)}x). Sebaiknya lakukan restrukturisasi COA, tingkatkan ARPU melalui penjualan silang paket Premium/Enterprise, atau kurangi biaya marketing (CAC) untuk mencapai stabilitas maksimal.`
                ) : (
                  `Peringatan: Bisnis tidak efisien! Biaya akuisisi (CAC) lebih besar daripada Lifetime Value sewa. Impas sulit tercapai dalam waktu dekat. Naikkan harga tarif langganan bulanan atau optimalkan biaya operasional sistem!`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHART SECTION (FORECAST PROJECTIONS compound) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPILING AREA GRAPH (8 columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Prospek Pertumbuhan Kontrak Sewa (MRR)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pertumbuhan compounding terdiskon Churn Rate bulanan ({monthlyGrowthRate}% pertumbuhan - {churnRate}% churn).</p>
            </div>
            <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-xl">Proyeksi {projectionMonths} MoM</span>
          </div>

          <div className="h-72 w-full pt-4">
            {realMRR === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Info className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-bold">Harap daftarkan penyewa berbayar aktif terlebih dahulu untuk membuat simulasi data.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={compoundProjData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                    tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'K'}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [formatIDR(value), 'MRR']}
                  />
                  <Area type="monotone" dataKey="MRR" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMRR)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* RIGHT PIE/BAR CHART BREAKDOWN BY ACCOUNT TIERS (4 columns) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-indigo-500" />
              Kontribusi per Paket
            </h3>
            <p className="text-[11px] text-slate-400">Distribusi jumlah pendaftaran sewa per kategori paket.</p>
          </div>

          <div className="h-48 w-full relative my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={planChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} 
                  width={70}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                  formatter={(value: any, name) => [value, name]}
                />
                <Bar dataKey="Tenants" radius={[0, 8, 8, 0]}>
                  {planChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-50 pt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Basic</span>
              <span>{planStats.Basic.count} Tenant ({formatIDR(planStats.Basic.revenue)})</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Premium</span>
              <span>{planStats.Premium.count} Tenant ({formatIDR(planStats.Premium.revenue)})</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Enterprise</span>
              <span>{planStats.Enterprise.count} Tenant ({formatIDR(planStats.Enterprise.revenue)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PLAN & REVENUE SUMMARY DETAIL LIST */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600" /> Performa Omset &amp; Alokasi Sewa Paket
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Pemetaan penetrasi pasar dan persentase sumbangsih masing-masing paket terhadap total MRR.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest col-span-2">Kategori Paket</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Penyewa Terdaftar</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sumbangsih Revenue MoM</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Porsi Pangsa Pasar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Premium Row */}
              <tr className="hover:bg-slate-50/40 transition">
                <td className="px-6 py-4 font-bold text-slate-805">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10.5px] font-extrabold uppercase">
                    Paket Premium
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">{planStats.Premium.count} Penyewa</td>
                <td className="px-6 py-4 font-black text-slate-900">{formatIDR(planStats.Premium.revenue)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">{realMRR > 0 ? ((planStats.Premium.revenue / realMRR) * 100).toFixed(0) : 0}%</span>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden block">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${realMRR > 0 ? (planStats.Premium.revenue / realMRR) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Enterprise Row */}
              <tr className="hover:bg-slate-50/40 transition">
                <td className="px-6 py-4 font-bold text-slate-805">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10.5px] font-extrabold uppercase">
                    Paket Enterprise
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">{planStats.Enterprise.count} Penyewa</td>
                <td className="px-6 py-4 font-black text-slate-900">{formatIDR(planStats.Enterprise.revenue)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">{realMRR > 0 ? ((planStats.Enterprise.revenue / realMRR) * 100).toFixed(0) : 0}%</span>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden block">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${realMRR > 0 ? (planStats.Enterprise.revenue / realMRR) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Basic Row */}
              <tr className="hover:bg-slate-50/40 transition">
                <td className="px-6 py-4 font-bold text-slate-805">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10.5px] font-extrabold uppercase">
                    Paket Basic
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">{planStats.Basic.count} Penyewa</td>
                <td className="px-6 py-4 font-black text-slate-900">{formatIDR(planStats.Basic.revenue)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">{realMRR > 0 ? ((planStats.Basic.revenue / realMRR) * 100).toFixed(0) : 0}%</span>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden block">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${realMRR > 0 ? (planStats.Basic.revenue / realMRR) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Trial Row */}
              <tr className="hover:bg-slate-50/40 transition text-slate-400">
                <td className="px-6 py-4 font-bold">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-extrabold uppercase">
                    Masa Uji Coba (Trial)
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{planStats.Trial.count} Penyewa</td>
                <td className="px-6 py-4 font-bold">Rp 0</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-slate-450 text-[10.5px] font-bold">
                    <span>Non-revenue</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TENANT ACTIVITY HEATMAP */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left mb-6">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-600" /> Tenant Engagement Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Intensitas aktivitas harian 12 penyewa teratas selama 30 hari terakhir.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-slate-100" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Idle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-indigo-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-indigo-900" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Intense</span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <div className="min-w-[800px] space-y-4">
            {/* Header Dates */}
            <div className="flex items-center gap-1 ml-[160px]">
              {last30Days.filter((_, i) => i % 5 === 0).map((d, i) => (
                <div key={i} className="flex-1 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                  {d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {heatmapData.length > 0 ? heatmapData.map((tenant, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-36 text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-600 truncate block pr-2" title={tenant.name}>
                      {tenant.name}
                    </span>
                  </div>
                  <div className="flex-1 flex gap-1 items-center">
                    {tenant.activity.map((intensity, dayIdx) => (
                      <motion.div
                        key={dayIdx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (idx * 0.02) + (dayIdx * 0.005) }}
                        className={`h-4 flex-1 rounded-sm ${getHeatmapColor(intensity)} transition-all hover:ring-1 hover:ring-white cursor-help`}
                        title={`Day ${30-dayIdx}: Intensity ${intensity}`}
                      />
                    ))}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center border border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                  <History className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-12">
                    Data tidak mencukupi untuk memetakan heatmap saat ini. <br/>
                    Daftarkan penyewa untuk melihat intensitas penggunaan realtime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
