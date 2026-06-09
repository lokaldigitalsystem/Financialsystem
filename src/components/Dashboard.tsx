/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Users, LayoutDashboard, ShoppingBag, Landmark, RefreshCw, Trash2, FileDown, Coins, Building, Target, Settings, Edit3, CheckCircle, TrendingUp, Sparkles, Calendar, AlertTriangle, Percent, Activity, ExternalLink, ShieldCheck, PhoneCall, HelpCircle, LifeBuoy, MessageSquare } from 'lucide-react';
import { CoaAccount, JurnalEntry, Anggota, StokItem, Tagihan, CoaKategori, SaldoNormal, PastSale } from '../types';

interface DashboardProps {
  coaData: CoaAccount[];
  jurnalData: JurnalEntry[];
  anggotaData: Anggota[];
  stokData: StokItem[];
  tagihanData?: Tagihan[];
  salesHistory: PastSale[];
  onUpdateSalesHistory: React.Dispatch<React.SetStateAction<PastSale[]>>;
  onNavigate: (page: string, jFilter?: string, cFilter?: string, cSearch?: string) => void;
  onResetData?: (toZero: boolean) => void;
  koperasiId?: string;
}

export function Dashboard(props: DashboardProps) {
  const [showResetConfirm, setShowResetConfirm] = React.useState<"zero" | "demo" | null>(null);
  const salesHistory = props.salesHistory;
  const setSalesHistory = props.onUpdateSalesHistory;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Chart selection state
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'area' | 'pie'>('bar');

  // KPI Target Tracker state
  const [kpiTargetType, setKpiTargetType] = React.useState<'omset' | 'profit'>(() => {
    const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetType` : 'kdmp_kpiTargetType';
    return (localStorage.getItem(key) as 'omset' | 'profit') || 'omset';
  });

  const [kpiTargetOmset, setKpiTargetOmset] = React.useState<number>(() => {
    const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetOmset` : 'kdmp_kpiTargetOmset';
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0; // Default to 0 for new tenants
  });

  const [kpiTargetProfit, setKpiTargetProfit] = React.useState<number>(() => {
    const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetProfit` : 'kdmp_kpiTargetProfit';
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0; // Default to 0 for new tenants
  });

  const [isEditingKpi, setIsEditingKpi] = React.useState<boolean>(false);
  const [tempTargetValue, setTempTargetValue] = React.useState<string>("");

  // Submenu tab selection state ('ringkasan' | 'analisis' | 'operasional' | 'analisis_mendalam')
  const [activeSubTab, setActiveSubTab] = React.useState<'ringkasan' | 'analisis' | 'operasional' | 'analisis_mendalam'>('ringkasan');
  
  const handleClearSalesHistory = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat penjualan (statistik produk terlaris) di dashboard ini? Tindakan ini bersifat permanen.")) {
      setSalesHistory([]);
    }
  };

  const handleDeleteProductHistory = (productName: string) => {
    if (window.confirm(`Hapus seluruh riwayat penjualan untuk "${productName}" dari statistik?`)) {
      setSalesHistory(prev => {
        const updated = prev.map(sale => ({
          ...sale,
          items: (sale.items || []).filter((item: any) => item.nama !== productName)
        })).filter(sale => (sale.items || []).length > 0);
        return updated;
      });
    }
  };

  // Calculate dynamic stats
  const saldoKasTunai = props.coaData
    .filter(c => c.kode === '1-1101')
    .reduce((acc, curr) => acc + curr.saldo, 0);

  const totalSaldoBank = props.coaData
    .filter(c => c.kode.startsWith('1-11') && c.kode !== '1-1101')
    .reduce((acc, curr) => acc + curr.saldo, 0);

  const totalAsetLancar = props.coaData
    .filter(c => c.kategori === 'Aset' && c.kode.startsWith('1-1'))
    .reduce((acc, curr) => acc + (curr.normal === 'Debet' ? curr.saldo : -curr.saldo), 0);

  const totalAsetTidakLancar = props.coaData
    .filter(c => c.kategori === 'Aset' && c.kode.startsWith('1-2'))
    .reduce((acc, curr) => acc + (curr.normal === 'Debet' ? curr.saldo : -curr.saldo), 0);

  const totalPenjualan = props.coaData
    .filter(c => c.kode === '4-1001')
    .reduce((acc, curr) => acc + curr.saldo, 0);

  const totalPembelian = props.coaData
    .filter(c => c.kode === '5-1001')
    .reduce((acc, curr) => acc + curr.saldo, 0);

  const totalAnggota = props.anggotaData.filter(a => a.status === 'Aktif').length;

  const totalPendapatan = props.coaData
    .filter(c => c.kategori === 'Pendapatan')
    .reduce((acc, curr) => acc + (curr.normal === 'Kredit' ? curr.saldo : -curr.saldo), 0);

  const totalBeban = props.coaData
    .filter(c => c.kategori === 'Beban')
    .reduce((acc, curr) => acc + (curr.normal === 'Debet' ? curr.saldo : -curr.saldo), 0);

  const labaBersih = totalPendapatan - totalBeban;

  const totalDanaAnggota = props.anggotaData.reduce((acc, curr) => acc + (curr.simpananPokok || 0), 0);

  const lowStockThreshold = 5;
  const lowStockItems = (props.stokData || []).filter(item => item.qty <= lowStockThreshold);

  // Track month index dynamically based on latest journal entry, or default to May (month index 4) in 2026
  const getActivePeriodIndex = () => {
    if (props.jurnalData.length === 0) return 4; // May
    let maxMonth = 4; // May default
    props.jurnalData.forEach(j => {
      const parts = j.tgl.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10) - 1;
        if (m >= 0 && m < 12) {
          if (m > maxMonth) maxMonth = m;
        }
      }
    });
    return maxMonth;
  };

  const totalPiutangBelumLunas = (props.tagihanData || [])
    .filter(t => t.status === 'Belum Bayar')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  // Preparing data for Omset vs Beban Comparison Chart (Last 6 Months)
  const statsPerformanceMonthly = React.useMemo(() => {
    const data: any[] = [];
    const currentMonth = getActivePeriodIndex();
    
    // We'll take last 6 months or until start of year
    for (let i = Math.max(0, currentMonth - 5); i <= currentMonth; i++) {
      let monthlyOmset = 0;
      let monthlyBeban = 0;
      
      props.jurnalData.forEach(j => {
        const parts = j.tgl.split('-');
        if (parts.length >= 2) {
          const entryM = parseInt(parts[1], 10) - 1;
          if (entryM === i) {
            // Find account category
            const acc = props.coaData.find(c => c.kode === j.akun);
            if (acc) {
              if (acc.kategori === 'Pendapatan') {
                monthlyOmset += (j.kredit - j.debet); // Revenue normally Kredit
              } else if (acc.kategori === 'Beban') {
                monthlyBeban += (j.debet - j.kredit); // Expenses normally Debet
              }
            }
          }
        }
      });
      
      data.push({
        name: months[i].substring(0, 3),
        longName: months[i],
        omset: Math.max(0, monthlyOmset),
        beban: Math.max(0, monthlyBeban),
        profit: monthlyOmset - monthlyBeban
      });
    }
    return data;
  }, [props.jurnalData, props.coaData, months]);

  const activeMonthIdx = getActivePeriodIndex();

  // Filter sales to current active month & 2026
  const activeSales = salesHistory.filter(sale => {
    const parts = sale.tgl.split('-');
    if (parts.length >= 2) {
      const saleYear = parseInt(parts[0], 10);
      const saleMonth = parseInt(parts[1], 10) - 1; // 0-indexed
      return saleYear === 2026 && saleMonth === activeMonthIdx;
    }
    return false;
  });

  const kpiStats = React.useMemo(() => {
    let omset = 0;
    let hpp = 0;
    activeSales.forEach(sale => {
      const sAmt = sale.total !== undefined ? sale.total : (sale.subtotal || 0);
      omset += sAmt;
      if (sale.items) {
        sale.items.forEach((item: any) => {
          let mCost = 0;
          if (item.hargaModal !== undefined) {
            mCost = item.hargaModal;
          } else {
            const mat = props.stokData?.find(s => s.nama === item.nama || s.id === item.stokId);
            mCost = mat && mat.hargaModal ? mat.hargaModal : Math.round(item.hargaJual * 0.75);
          }
          hpp += (item.qty * mCost);
        });
      }
    });
    const profit = omset - hpp;
    return { omset, profit };
  }, [activeSales, props.stokData]);

  const currentKpiValue = kpiTargetType === 'omset' ? kpiStats.omset : kpiStats.profit;
  const targetKpiValue = kpiTargetType === 'omset' ? kpiTargetOmset : kpiTargetProfit;
  const kpiPercentage = targetKpiValue > 0 ? Math.min(100, Math.round((currentKpiValue / targetKpiValue) * 100)) : 0;

  const handleKpiTypeChange = (type: 'omset' | 'profit') => {
    setKpiTargetType(type);
    const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetType` : 'kdmp_kpiTargetType';
    localStorage.setItem(key, type);
  };

  const handleSaveKpiTarget = () => {
    const val = parseInt(tempTargetValue, 10);
    if (!isNaN(val) && val >= 0) {
      if (kpiTargetType === 'omset') {
        setKpiTargetOmset(val);
        const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetOmset` : 'kdmp_kpiTargetOmset';
        localStorage.setItem(key, val.toString());
      } else {
        setKpiTargetProfit(val);
        const key = props.koperasiId ? `kdmp_${props.koperasiId}_kpiTargetProfit` : 'kdmp_kpiTargetProfit';
        localStorage.setItem(key, val.toString());
      }
      setIsEditingKpi(false);
    }
  };

  const productSalesMap: Record<string, { qty: number; revenue: number; hpp: number }> = {};
  activeSales.forEach(sale => {
    if (sale.items) {
      sale.items.forEach((item: any) => {
        const pName = item.nama;
        let mCost = 0;
        if (item.hargaModal !== undefined) {
          mCost = item.hargaModal;
        } else {
          const mat = props.stokData?.find(s => s.nama === item.nama || s.id === item.stokId);
          mCost = mat && mat.hargaModal ? mat.hargaModal : Math.round(item.hargaJual * 0.75);
        }

        if (!productSalesMap[pName]) {
          productSalesMap[pName] = { qty: 0, revenue: 0, hpp: 0 };
        }
        productSalesMap[pName].qty += item.qty;
        productSalesMap[pName].revenue += (item.qty * item.hargaJual);
        productSalesMap[pName].hpp += (item.qty * mCost);
      });
    }
  });

  const rankedProducts = Object.entries(productSalesMap).map(([name, data]) => {
    const profit = data.revenue - data.hpp;
    const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
    return {
      name,
      qty: data.qty,
      revenue: data.revenue,
      profit,
      margin
    };
  }).sort((a, b) => b.qty - a.qty);

  // Helpers to calculate specific assets at a given month index for trends
  const getKasTunaiAtMonth = (m: number) => {
    return props.coaData
      .filter(c => c.kode === '1-1101')
      .reduce((acc, c) => {
        const base = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
        let change = 0;
        props.jurnalData.forEach(j => {
          const parts = j.tgl.split('-');
          if (parts.length >= 2) {
            const entryM = parseInt(parts[1], 10) - 1;
            if (entryM <= m) {
              if (j.akun === c.kode) {
                change += (j.debet - j.kredit);
              }
            }
          }
        });
        return acc + (base + change);
      }, 0);
  };

  const getSaldoBankAtMonth = (m: number) => {
    return props.coaData
      .filter(c => c.kode.startsWith('1-11') && c.kode !== '1-1101')
      .reduce((acc, c) => {
        const base = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
        let change = 0;
        props.jurnalData.forEach(j => {
          const parts = j.tgl.split('-');
          if (parts.length >= 2) {
            const entryM = parseInt(parts[1], 10) - 1;
            if (entryM <= m) {
              if (j.akun === c.kode) {
                change += (j.debet - j.kredit);
              }
            }
          }
        });
        return acc + (base + change);
      }, 0);
  };

  const getAsetLancarAtMonth = (m: number) => {
    return props.coaData
      .filter(c => c.kategori === 'Aset' && c.kode.startsWith('1-1'))
      .reduce((acc, c) => {
        const base = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
        let change = 0;
        props.jurnalData.forEach(j => {
          const parts = j.tgl.split('-');
          if (parts.length >= 2) {
            const entryM = parseInt(parts[1], 10) - 1;
            if (entryM <= m) {
              if (j.akun === c.kode) {
                if (c.normal === 'Debet') {
                  change += (j.debet - j.kredit);
                } else {
                  change += (j.kredit - j.debet);
                }
              }
            }
          }
        });
        return acc + (base + change);
      }, 0);
  };

  const getAsetTidakLancarAtMonth = (m: number) => {
    return props.coaData
      .filter(c => c.kategori === 'Aset' && c.kode.startsWith('1-2'))
      .reduce((acc, c) => {
        const base = c.saldoAwal !== undefined ? c.saldoAwal : c.saldo;
        let change = 0;
        props.jurnalData.forEach(j => {
          const parts = j.tgl.split('-');
          if (parts.length >= 2) {
            const entryM = parseInt(parts[1], 10) - 1;
            if (entryM <= m) {
              if (j.akun === c.kode) {
                if (c.normal === 'Debet') {
                  change += (j.debet - j.kredit);
                } else {
                  change += (j.kredit - j.debet);
                }
              }
            }
          }
        });
        return acc + (base + change);
      }, 0);
  };

  const kasTunaiCurrent = getKasTunaiAtMonth(activeMonthIdx);
  const kasTunaiPrev = activeMonthIdx > 0 ? getKasTunaiAtMonth(activeMonthIdx - 1) : kasTunaiCurrent;
  let kasTunaiTrend = 0;
  if (kasTunaiPrev > 0) {
    kasTunaiTrend = ((kasTunaiCurrent - kasTunaiPrev) / kasTunaiPrev) * 100;
  } else if (kasTunaiCurrent > 0) {
    kasTunaiTrend = 100;
  }

  const bankCurrent = getSaldoBankAtMonth(activeMonthIdx);
  const bankPrev = activeMonthIdx > 0 ? getSaldoBankAtMonth(activeMonthIdx - 1) : bankCurrent;
  let bankTrend = 0;
  if (bankPrev > 0) {
    bankTrend = ((bankCurrent - bankPrev) / bankPrev) * 100;
  } else if (bankCurrent > 0) {
    bankTrend = 100;
  }

  const lancarCurrent = getAsetLancarAtMonth(activeMonthIdx);
  const lancarPrev = activeMonthIdx > 0 ? getAsetLancarAtMonth(activeMonthIdx - 1) : lancarCurrent;
  let lancarTrend = 0;
  if (lancarPrev > 0) {
    lancarTrend = ((lancarCurrent - lancarPrev) / lancarPrev) * 100;
  } else if (lancarCurrent > 0) {
    lancarTrend = 100;
  }

  const tidakLancarCurrent = getAsetTidakLancarAtMonth(activeMonthIdx);
  const tidakLancarPrev = activeMonthIdx > 0 ? getAsetTidakLancarAtMonth(activeMonthIdx - 1) : tidakLancarCurrent;
  let tidakLancarTrend = 0;
  if (tidakLancarPrev > 0) {
    tidakLancarTrend = ((tidakLancarCurrent - tidakLancarPrev) / tidakLancarPrev) * 100;
  } else if (tidakLancarCurrent > 0) {
    tidakLancarTrend = 100;
  }

  // Penjualan (4-1001) in current month vs prev month
  const getPenjualanTotalInMonth = (m: number) => {
    let sum = 0;
    props.jurnalData.forEach(j => {
      const parts = j.tgl.split('-');
      if (parts.length >= 2) {
        const entryM = parseInt(parts[1], 10) - 1;
        if (entryM === m) {
          if (j.akun === '4-1001') {
            sum += (j.kredit - j.debet);
          }
        }
      }
    });
    return sum;
  };

  const penjualanCurrent = getPenjualanTotalInMonth(activeMonthIdx);
  const penjualanPrev = activeMonthIdx > 0 ? getPenjualanTotalInMonth(activeMonthIdx - 1) : 0;
  let penjualanTrend = 0;
  if (penjualanPrev > 0) {
    penjualanTrend = ((penjualanCurrent - penjualanPrev) / penjualanPrev) * 100;
  } else if (penjualanCurrent > 0) {
    penjualanTrend = 100;
  }

  // Pembelian/HPP (5-1001) in current month vs prev month
  const getPembelianTotalInMonth = (m: number) => {
    let sum = 0;
    props.jurnalData.forEach(j => {
      const parts = j.tgl.split('-');
      if (parts.length >= 2) {
        const entryM = parseInt(parts[1], 10) - 1;
        if (entryM === m) {
          if (j.akun === '5-1001') {
            sum += (j.debet - j.kredit);
          }
        }
      }
    });
    return sum;
  };

  const pembelianCurrent = getPembelianTotalInMonth(activeMonthIdx);
  const pembelianPrev = activeMonthIdx > 0 ? getPembelianTotalInMonth(activeMonthIdx - 1) : 0;
  let pembelianTrend = 0;
  if (pembelianPrev > 0) {
    pembelianTrend = ((pembelianCurrent - pembelianPrev) / pembelianPrev) * 100;
  } else if (pembelianCurrent > 0) {
    pembelianTrend = 100;
  }

  // Active member count trend based on total additions above base (3)
  const memberTrend = props.anggotaData.length > 3 ? ((props.anggotaData.length - 3) / 3) * 100 : 0;

  // 1. RASIO LIKUIDITAS DAN KESEHATAN FINANSIAL
  const totalKewajiban = props.coaData
    .filter(c => c.kategori === CoaKategori.Kewajiban)
    .reduce((acc, curr) => acc + (curr.normal === SaldoNormal.Kredit ? curr.saldo : -curr.saldo), 0);

  const totalEkuitas = props.coaData
    .filter(c => c.kategori === CoaKategori.Ekuitas)
    .reduce((acc, curr) => acc + (curr.normal === SaldoNormal.Kredit ? curr.saldo : -curr.saldo), 0);

  const totalAset = totalAsetLancar + totalAsetTidakLancar;

  const kasDanBank = saldoKasTunai + totalSaldoBank;
  const currentRatio = totalKewajiban > 0 ? (totalAsetLancar / totalKewajiban) * 100 : (totalAsetLancar > 0 ? 999 : 100);
  const cashRatio = totalKewajiban > 0 ? (kasDanBank / totalKewajiban) * 100 : (kasDanBank > 0 ? 999 : 100);
  
  // Solvabilitas
  const debtToAssetRatio = totalAset > 0 ? (totalKewajiban / totalAset) * 100 : 0;
  const debtToEquityRatio = totalEkuitas > 0 ? (totalKewajiban / totalEkuitas) * 100 : 0;

  // Profitabilitas
  const grossProfit = totalPendapatan - totalPembelian; // Assuming 5-1001 is HPP
  const grossMargin = totalPendapatan > 0 ? (grossProfit / totalPendapatan) * 100 : 0;
  const netMargin = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;
  const roa = totalAset > 0 ? (labaBersih / totalAset) * 100 : 0;
  const roe = totalEkuitas > 0 ? (labaBersih / totalEkuitas) * 100 : 0;

  // Efficiency
  const expenseToRevenueRatio = totalPendapatan > 0 ? (totalBeban / totalPendapatan) * 100 : 0;
  const hppToRevenueRatio = totalPendapatan > 0 ? (totalPembelian / totalPendapatan) * 100 : 0;

  // Runway/Burn Rate (Simple estimation)
  const averageMonthlyExpense = statsPerformanceMonthly.length > 0 
    ? statsPerformanceMonthly.reduce((acc, curr) => acc + curr.beban, 0) / statsPerformanceMonthly.length 
    : totalBeban;
  const runwayMonths = averageMonthlyExpense > 0 ? (kasDanBank / averageMonthlyExpense) : (kasDanBank > 0 ? 99 : 0);

  // 2. PIUTANG JATUH TEMPO (ALERT PANEL)
  const unpaidInvoices = React.useMemo(() => {
    const list = props.tagihanData || [];
    return list.filter(t => t.status === "Belum Bayar").map(t => {
      const issueDate = new Date(t.tglTagihan);
      const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const today = new Date("2026-06-02");
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...t,
        dueDateFormated: dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        diffDays
      };
    }).sort((a, b) => a.diffDays - b.diffDays);
  }, [props.tagihanData]);

  const totalReceivablesValue = unpaidInvoices.reduce((acc, curr) => acc + curr.jumlah, 0);

  const overdueInvoices = unpaidInvoices.filter(i => i.diffDays < 0);
  const upcomingInvoices = unpaidInvoices.filter(i => i.diffDays >= 0 && i.diffDays <= 7);

  // 3. KALENDER KAS MAKRO
  const [selectedCalendarDay, setSelectedCalendarDay] = React.useState<number>(() => {
    const today = new Date("2026-06-02");
    return today.getDate(); // Default to 2
  });

  const daysInMonthList = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDaysCurrentMonth = daysInMonthList[activeMonthIdx] || 31;
  const clampedCalendarDay = Math.min(selectedCalendarDay, maxDaysCurrentMonth);

  const firstDayIndex = React.useMemo(() => {
    return new Date(2026, activeMonthIdx, 1).getDay();
  }, [activeMonthIdx]);

  const dailyActivityMap = React.useMemo(() => {
    const map: Record<number, { masuk: number; keluar: number; txCount: number }> = {};
    for (let d = 1; d <= maxDaysCurrentMonth; d++) {
      map[d] = { masuk: 0, keluar: 0, txCount: 0 };
    }

    props.jurnalData.forEach(j => {
      const parts = j.tgl.split('-');
      if (parts.length >= 3) {
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10) - 1;
        const dy = parseInt(parts[2], 10);
        if (yr === 2026 && mo === activeMonthIdx) {
          if (map[dy]) {
            map[dy].txCount += 0.5;
            if (j.akun.startsWith('1-11')) {
              if (j.debet > 0) map[dy].masuk += j.debet;
              if (j.kredit > 0) map[dy].keluar += j.kredit;
            }
          }
        }
      }
    });

    for (let d = 1; d <= maxDaysCurrentMonth; d++) {
      map[d].txCount = Math.max(map[d].masuk > 0 || map[d].keluar > 0 ? 1 : 0, Math.round(map[d].txCount));
    }

    return map;
  }, [props.jurnalData, activeMonthIdx, maxDaysCurrentMonth]);

  const selectedDayTransactions = React.useMemo(() => {
    return props.jurnalData.filter(j => {
      const parts = j.tgl.split('-');
      if (parts.length >= 3) {
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10) - 1;
        const dy = parseInt(parts[2], 10);
        return yr === 2026 && mo === activeMonthIdx && dy === clampedCalendarDay;
      }
      return false;
    });
  }, [props.jurnalData, activeMonthIdx, clampedCalendarDay]);

  // Recent 5 unique journals based on 'no' group
  const trackedNo = new Set<string>();
  const recentMutations: { no: string; tgl: string; ket: string; total: number; type: 'debet' | 'kredit' }[] = [];

  for (let i = props.jurnalData.length - 1; i >= 0 && recentMutations.length < 5; i--) {
    const entry = props.jurnalData[i];
    if (!trackedNo.has(entry.no)) {
      trackedNo.add(entry.no);
      const isIncome = entry.akun.startsWith('1-11') && entry.debet > 0;
      recentMutations.push({
        no: entry.no,
        tgl: entry.tgl,
        ket: entry.ket,
        total: entry.debet > 0 ? entry.debet : entry.kredit,
        type: isIncome ? 'debet' : 'kredit'
      });
    }
  }

  // Real-time Monthly Cash Flow calculation based on General Journal entries
  const getMonthlyCashFlow = (monthIndex: number) => {
    let masuk = 0;
    let keluar = 0;
    props.jurnalData.forEach(j => {
      const dateParts = j.tgl.split('-');
      if (dateParts.length >= 2) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        if (month === monthIndex && year === 2026) {
          if (j.akun.startsWith('1-11')) {
            masuk += j.debet;
            keluar += j.kredit;
          }
        }
      }
    });
    return { masuk, keluar };
  };

  const barData = [
    { label: 'Jan', ...getMonthlyCashFlow(0) },
    { label: 'Feb', ...getMonthlyCashFlow(1) },
    { label: 'Mar', ...getMonthlyCashFlow(2) },
    { label: 'Apr', ...getMonthlyCashFlow(3) },
    { label: 'Mei', ...getMonthlyCashFlow(4) }
  ];

  const maxVal = Math.max(...barData.flatMap(b => [b.masuk, b.keluar]), 1000) * 1.15;
  const scaleMax = maxVal / 1.15;

  const ptsMasuk = barData.map((d, i) => ({
    x: 50 + i * 100,
    y: 180 - (d.masuk / maxVal) * 160
  }));

  const ptsKeluar = barData.map((d, i) => ({
    x: 50 + i * 100,
    y: 180 - (d.keluar / maxVal) * 160
  }));

  const linePathMasuk = ptsMasuk.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const linePathKeluar = ptsKeluar.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPathMasuk = `${linePathMasuk} L ${ptsMasuk[ptsMasuk.length-1].x} 180 L ${ptsMasuk[0].x} 180 Z`;
  const areaPathKeluar = `${linePathKeluar} L ${ptsKeluar[ptsKeluar.length-1].x} 180 L ${ptsKeluar[0].x} 180 Z`;

  const formatYAxis = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)}jt`;
    }
    if (val === 0) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Section 1: Ringkasan Metrik
    csvContent += "RINGKASAN METRIK KOPERASI UTAMA (2026)\r\n";
    csvContent += "Metrik,Nilai (Rp / Jumlah)\r\n";
    csvContent += `Saldo Kas Tunai,${saldoKasTunai}\r\n`;
    csvContent += `Total Saldo Bank,${totalSaldoBank}\r\n`;
    csvContent += `Total Aset Lancar,${totalAsetLancar}\r\n`;
    csvContent += `Total Aset Tidak Lancar,${totalAsetTidakLancar}\r\n`;
    csvContent += `Penjualan Unit Toko,${totalPenjualan}\r\n`;
    csvContent += `Pembelian Persediaan (HPP),${totalPembelian}\r\n`;
    csvContent += `Anggota Koperasi Aktif,${totalAnggota}\r\n`;
    csvContent += "\r\n";

    // Section 2: Komoditas Terlaris
    csvContent += `KOMODITAS TERLARIS BULAN ${months[activeMonthIdx].toUpperCase()} 2026\r\n`;
    csvContent += "Peringkat,Nama Komoditas,Jumlah Terjual (Unit),Omset Penjualan (Rp),Profit Bersih (Rp),Margin (%)\r\n";
    
    if (rankedProducts.length > 0) {
      rankedProducts.forEach((p, idx) => {
        const row = [
          `"${idx + 1}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          p.qty.toString(),
          p.revenue.toString(),
          p.profit.toString(),
          `"${p.margin.toFixed(1)}%"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "No data,No data,No data,No data,No data,No data\r\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DASHBOARD_RINGKASAN_Koperasi_Desa_Merah_Putih_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMasukForPie = barData.reduce((acc, curr) => acc + curr.masuk, 0);
  const totalKeluarForPie = barData.reduce((acc, curr) => acc + curr.keluar, 0);

  const masukPieData = barData.map((d, i) => {
    const colors = ['#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    return {
      label: d.label,
      value: d.masuk,
      color: colors[i % colors.length]
    };
  });

  const keluarPieData = barData.map((d, i) => {
    const colors = ['#be123c', '#ef4444', '#f87171', '#fca5a5', '#fecaca'];
    return {
      label: d.label,
      value: d.keluar,
      color: colors[i % colors.length]
    };
  });

  const renderDonut = (
    dataList: { label: string; value: number; color: string }[],
    total: number,
    title: string,
    emptyColor: string
  ) => {
    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-gray-100 min-w-[200px]" id={`donut-empty-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          <svg className="w-20 h-20 overflow-visible" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="none" stroke={emptyColor} strokeWidth="10" strokeOpacity="0.1" />
          </svg>
          <span className="text-[11px] font-semibold text-gray-400 mt-2">Tidak ada data {title}</span>
        </div>
      );
    }

    let accumulatedPercent = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius; // ~219.91

    return (
      <div className="flex flex-col items-center bg-slate-50/50 p-4 rounded-xl border border-gray-100 shadow-xs flex-1 max-w-[260px] relative" id={`donut-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <span className="text-xs font-bold text-gray-750 mb-3">{title}</span>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full overflow-visible transform -rotate-90" viewBox="0 0 100 100">
            {dataList.map((item, idx) => {
              const percent = item.value / total;
              if (percent === 0) return null;
              const strokeLength = percent * circumference;
              const strokeOffset = circumference - (accumulatedPercent * circumference);
              accumulatedPercent += percent;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-300 hover:stroke-[15] cursor-pointer"
                  style={{ transformOrigin: '50% 50%' }}
                >
                  <title>{`${item.label}: Rp ${item.value.toLocaleString('id-ID')} (${(percent * 100).toFixed(1)}%)`}</title>
                </circle>
              );
            })}
            <circle cx="50" cy="50" r="28" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Total</span>
            <span className="text-xs font-extrabold text-gray-800">
              {total >= 1000000 
                ? `Rp ${(total / 1000000).toFixed(1)}jt` 
                : `Rp ${(total / 1000).toFixed(0)}rb`
              }
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1 w-full max-h-16 overflow-y-auto">
          {dataList.map((item, idx) => {
            if (item.value === 0) return null;
            const pct = (item.value / total) * 100;
            return (
              <div key={idx} className="flex items-center gap-1 text-[9px] font-bold text-gray-550 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span>{item.label} ({pct.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="dashboard-system">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-red-600" /> Dashboard Utama
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Data statistik performa real-time dan ringkasan keuangan periode berjalan tahun 2026
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
          <button 
            id="nav-to-jurnal"
            onClick={() => props.onNavigate('jurnal')}
            className="px-4 py-2 bg-[#1a48f0] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Wallet className="h-4 w-4" /> Mulai Jurnal Baru
          </button>
          <button
            id="export-dashboard-csv-btn"
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition duration-150 cursor-pointer active:scale-95"
            title="Download Summary Report & Best Selling Products"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
        </div>
      </div>

      {/* TOP KPI PERFORMANCE CARDS */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {/* LABA BERSIH KPI */}
        <motion.div 
          variants={itemVariants}
          className="bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-800 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-32 w-32 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laba Bersih (S.H.U)</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight leading-none mb-1">
              Rp {labaBersih.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 ${labaBersih >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {labaBersih >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {labaBersih >= 0 ? '+' : ''}2.4%
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Performa Kumulatif</span>
            </div>
          </div>
        </motion.div>

        {/* PIUTANG AKTIF KPI */}
        <motion.div 
          variants={itemVariants}
          onClick={() => props.onNavigate('invoice')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:border-amber-200 transition-all"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="h-32 w-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Piutang Anggota</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              Rp {totalPiutangBelumLunas.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                {unpaidInvoices.length} Tagihan Belum Lunas
              </span>
            </div>
          </div>
        </motion.div>

        {/* DANA ANGGOTA KPI */}
        <motion.div 
          variants={itemVariants}
          onClick={() => props.onNavigate('anggota')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:border-indigo-200 transition-all"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Landmark className="h-32 w-32 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Building className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Simpanan Pokok</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              Rp {totalDanaAnggota.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-indigo-600">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Dari {totalAnggota} Anggota Aktif</span>
            </div>
          </div>
        </motion.div>

        {/* PROGRESS KPI TARGET */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setActiveSubTab('analisis')}
          className="bg-emerald-600 rounded-2xl p-5 shadow-xl shadow-emerald-600/10 relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
        >
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-32 w-32 text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">Target {kpiTargetType === 'omset' ? 'Omset' : 'Profit'} {months[activeMonthIdx]}</span>
            </div>
            <div className="text-2xl font-black tracking-tight leading-none mb-2">
              {kpiPercentage}%
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full" style={{ width: `${kpiPercentage}%` }} />
            </div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-tight text-emerald-100">
              Rp {currentKpiValue.toLocaleString('id-ID')} / {targetKpiValue.toLocaleString('id-ID')}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* DASHBOARD SUBMENU TABS */}
      <div className="flex border border-gray-100 mb-6 font-semibold overflow-x-auto gap-1.5 p-1 bg-slate-50 rounded-xl" id="submenu-tabs-navigation">
        <button
          type="button"
          onClick={() => setActiveSubTab('ringkasan')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-1 active:scale-95 ${
            activeSubTab === 'ringkasan'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Arus Kas & Ringkasan Utama
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('analisis')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-1 active:scale-95 ${
            activeSubTab === 'analisis'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          Kesehatan & KPI Target
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('operasional')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-1 active:scale-95 ${
            activeSubTab === 'operasional'
              ? 'bg-red-600 text-[#000000] shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Kalender & Peringatan Piutang
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('analisis_mendalam')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-1 active:scale-95 ${
            activeSubTab === 'analisis_mendalam'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-700 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Analisis Mendalam
        </button>
      </div>

      {/* SUBTAB CONTENT 1: KESEHATAN & KPI TARGET */}
      {activeSubTab === 'analisis' && (
        <div className="space-y-6">
          {/* QUICK FINANCIAL RATIOS (RASIO LIKUIDITAS INSTAN) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-50">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Activity className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Rasio Kesehatan & Likuiditas Finansial Instan</h3>
            <p className="text-[10.5px] text-gray-500">
              Indikator real-time kesehatan kas & solvabilitas jangka pendek koperasi berdasarkan standar akuntansi nasional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CURRENT RATIO CARD */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Current Ratio (Rasio Lancar)</span>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                  currentRatio >= 150 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : currentRatio >= 100 
                      ? "bg-amber-50 text-amber-700 border border-amber-100" 
                      : "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse"
                }`}>
                  {currentRatio >= 150 ? "Sangat Sehat" : currentRatio >= 100 ? "Cukup Solven" : "Kritis / Rentan"}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">{currentRatio.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-400 font-medium">Lancar</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed">
                Menakar kelayakan Aset Lancar sebesar <strong className="text-slate-700 font-bold">Rp {totalAsetLancar.toLocaleString('id-ID')}</strong> dalam menjamin seluruh total kewajiban/utang jangka pendek berjalan.
              </p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400 font-medium">
              <span>Rasio Optimal: &gt; 120%</span>
              <span className="text-slate-400 font-mono">Aset Lancar / Total Kewajiban</span>
            </div>
          </div>

          {/* CASH RATIO CARD */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Cash Ratio (Rasio Kas)</span>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                  cashRatio >= 40 
                    ? "bg-teal-50 text-teal-700 border border-teal-100" 
                    : cashRatio >= 15 
                      ? "bg-slate-100 text-slate-700 border border-slate-200" 
                      : "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse"
                }`}>
                  {cashRatio >= 40 ? "Likuiditas Kuat" : cashRatio >= 15 ? "Likuiditas Aman" : "Likuiditas Rendah"}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">{cashRatio.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-400 font-medium">Kas & Bank</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed">
                Porsi kas fisik & saldo bank senilai <strong className="text-slate-700 font-bold">Rp {(saldoKasTunai + totalSaldoBank).toLocaleString('id-ID')}</strong> yang tersedia instan untuk segera ditarik/dilunaskan pada kewajiban jatuh tempo.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400 font-medium">
              <span>Rasio Optimal: &gt; 25%</span>
              <span className="text-slate-400 font-mono">(Kas + Bank) / Total Kewajiban</span>
            </div>
          </div>

          {/* SOLVABILITAS SUMMARY & VERIFICATION CARD */}
          <div className="bg-gradient-to-br from-red-50/10 to-white border border-red-100/50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Jaminan Solvabilitas
                </span>
                <span className="text-[9.5px] font-extrabold text-slate-400">Tahun Buku 2026</span>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Total Kewajiban</span>
                  <span className="font-mono font-bold text-slate-900">Rp {totalKewajiban.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Cadangan Kas Tersedia</span>
                  <span className="font-mono font-bold text-emerald-600">Rp {(saldoKasTunai + totalSaldoBank).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] border-t pt-1 border-slate-100">
                  <span className="text-slate-500 font-medium">Total Aset Lancar</span>
                  <span className="font-mono font-bold text-slate-900">Rp {totalAsetLancar.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal mt-3">
                {currentRatio >= 100 
                  ? "👍 Kondisi kas & piutang lancar aman. Koperasi memiliki kapasitas finansial yang memadai untuk memenuhi komitmen keuangan harian secara mandiri."
                  : "⚠️ Peringatan: Kewajiban berjalan melampaui cadangan aset lancar. Harap perhatikan penataan kembali likuiditas kas masuk."}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400 font-medium">
              <span>Database Status:</span>
              <span className="text-emerald-600 font-semibold uppercase flex items-center gap-0.5">● TERKONEKSI</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON CHART: OMSET VS BEBAN */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8"
      >
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Perbandingan Efisiensi: Omset vs Beban</h3>
              <p className="text-[10.5px] text-gray-500">Analisis tren pendapatan kotor dibandingkan biaya operasional (Last {statsPerformanceMonthly.length} Months)</p>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Omset
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Beban
            </div>
          </div>
        </div>
        <div className="p-5 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsPerformanceMonthly}>
              <defs>
                <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBeban" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                tickFormatter={(value) => `Rp ${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 600 }}
                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                labelStyle={{ fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#94a3b8' }}
              />
              <Area 
                type="monotone" 
                dataKey="omset" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOmset)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Total Omset"
              />
              <Area 
                type="monotone" 
                dataKey="beban" 
                stroke="#f43f5e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBeban)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Total Beban"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-50 px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Rata-rata Margin</span>
              <span className="text-xs font-black text-slate-800 tracking-tight mt-1">
                {statsPerformanceMonthly.length > 0 
                  ? ((statsPerformanceMonthly.reduce((acc, curr) => acc + (curr.omset > 0 ? (curr.profit / curr.omset) * 100 : 0), 0) / statsPerformanceMonthly.length).toFixed(1)) 
                  : 0}%
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Efisiensi</span>
              <span className={`text-xs font-black tracking-tight mt-1 ${labaBersih > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {labaBersih > totalBeban * 0.2 ? 'Sangat Efisien' : labaBersih > 0 ? 'Optimal' : 'Defisit / Evaluasi'}
              </span>
            </div>
          </div>
          <button
            onClick={() => props.onNavigate('laporan')}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider"
          >
            Analisis Laporan Lengkap <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* KPI & TARGET TRACKER (PELACAK CAPAIAN BULANAN) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="bg-gradient-to-r from-red-50/50 via-white to-red-50/20 p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-150 bg-red-50 text-red-650 text-red-600 rounded-lg">
              <Target className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                KPI & Target Capaian Bulanan - <span className="text-red-650 text-red-600">{months[activeMonthIdx]} 2026</span>
              </h3>
              <p className="text-[10.5px] text-gray-500">Pelacak target finansial real-time yang terintegrasi otomatis dengan pencatatan kasir POS</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleKpiTypeChange('omset')}
              className={`px-3 py-1 text-[10px] font-bold rounded transition cursor-pointer select-none ${
                kpiTargetType === 'omset'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Omset Penjualan
            </button>
            <button
              type="button"
              onClick={() => handleKpiTypeChange('profit')}
              className={`px-3 py-1 text-[10px] font-bold rounded transition cursor-pointer select-none ${
                kpiTargetType === 'profit'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Keuntungan (SHU)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* LEFT PANEL: PROGRESS BAR & TARGET DISPLAYS */}
          <div className="p-5 md:col-span-12 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Akumulasi Pencapaian Berjalan</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-baseline gap-2 flex-wrap">
                    <span>Rp {currentKpiValue.toLocaleString('id-ID')}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      dari target Rp {targetKpiValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 font-semibold text-xs leading-none">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{kpiPercentage}% Tercapai</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 shadow-inner mt-3 flex items-center relative">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out relative flex items-center justify-end pr-2 min-w-[24px] ${
                    kpiPercentage >= 100
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-md shadow-emerald-200 animate-pulse'
                      : kpiTargetType === 'omset'
                        ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600'
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
                  }`}
                  style={{ width: `${kpiPercentage}%` }}
                >
                  <span className="text-[9px] font-black text-white leading-none tracking-wider select-none font-mono">
                    {kpiPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Notification message */}
            <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100/50 text-[11px] leading-relaxed">
              {kpiPercentage >= 100 ? (
                <div className="flex items-start gap-2 text-emerald-800">
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <span className="font-extrabold text-xs text-emerald-800 flex items-center gap-1">
                      🏆 KPI Target Sukses Terlampaui!
                    </span>
                    <p className="mt-0.5 text-slate-600 font-medium leading-normal">
                      Selamat! Kinerja operasional Koperasi luar biasa pada periode {months[activeMonthIdx]} 2026. Target {kpiTargetType === 'omset' ? 'omset' : 'SHU'} sebesar <strong className="text-emerald-700 font-bold">Rp {targetKpiValue.toLocaleString('id-ID')}</strong> berhasil dilampaui dengan sisa surplus positif <strong className="text-emerald-700 font-bold">Rp {(currentKpiValue - targetKpiValue).toLocaleString('id-ID')}</strong>! Pertahankan kinerja hebat ini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-slate-600">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-1.5 animate-ping flex-shrink-0" />
                  <p className="font-medium leading-normal text-slate-500">
                    Sistem memantau pergerakan omset POS secara real-time. Anda memerlukan tambahan sebesar <strong className="text-slate-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150">Rp {(targetKpiValue - currentKpiValue).toLocaleString('id-ID')}</strong> lagi untuk mencapai sasaran target bulan ini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SETTINGS & PRESETS EDITOR */}
          <div className="p-5 md:col-span-12 lg:col-span-5 bg-slate-50/30 flex flex-col justify-center">
            {isEditingKpi ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Set Target Baru ({kpiTargetType === 'omset' ? 'Omset' : 'SHU'})</label>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingKpi(false)} 
                    className="text-[10.5px] font-bold text-slate-400 hover:text-red-650 hover:text-red-650 transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400">Rp</span>
                  </div>
                  <input
                    type="text"
                    value={tempTargetValue}
                    onChange={(e) => setTempTargetValue(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Masukkan angka target"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800"
                  />
                </div>

                {/* Pre-sets */}
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-1.5 uppercase">Presets Cepat</span>
                  <div className="flex flex-wrap gap-1">
                    {(kpiTargetType === 'omset' ? [5000000, 10000000, 15000000, 25000000, 50000000] : [1000000, 3000000, 5000000, 10000000, 15000000]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempTargetValue(preset.toString())}
                        className="px-2 py-1 text-[9.5px] font-bold bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded shadow-sm cursor-pointer select-none transition"
                      >
                        {preset >= 1000000 ? `${preset / 1000000} Jt` : preset.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(tempTargetValue, 10) || 0;
                        setTempTargetValue((cur + 1000000).toString());
                      }}
                      className="px-2 py-1 text-[9px] font-bold bg-rose-50 hover:bg-rose-100 text-red-600 rounded border border-rose-100 cursor-pointer transition select-none flex-1 text-center"
                    >
                      + 1 Juta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(tempTargetValue, 10) || 0;
                        setTempTargetValue((cur + 5000000).toString());
                      }}
                      className="px-2 py-1 text-[9px] font-bold bg-rose-50 hover:bg-rose-100 text-red-600 rounded border border-rose-100 cursor-pointer transition select-none flex-1 text-center"
                    >
                      + 5 Juta
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveKpiTarget}
                  className="w-full py-1.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Simpan Konfigurasi Target
                </button>
              </div>
            ) : (
              <div className="text-center p-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Aktif {kpiTargetType === 'omset' ? 'Omset' : 'SHU'}</span>
                <span className="text-lg font-black text-slate-700 block font-mono bg-slate-100/50 py-1 rounded-lg border border-slate-100">
                  Rp {targetKpiValue.toLocaleString('id-ID')}
                </span>
                <p className="text-[9.5px] text-slate-400 mt-1.5 leading-normal">
                  Target ini dievaluasi secara dinamis berdasarkan data mutasi buku kas & rekapitulasi penjualan harian.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTempTargetValue(targetKpiValue.toString());
                    setIsEditingKpi(true);
                  }}
                  className="mt-3.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg shadow-xs flex items-center justify-center gap-1 mx-auto transition cursor-pointer active:scale-95"
                >
                  <Edit3 className="h-3 w-3" /> Sesuaikan Nominal Target
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {/* SUBTAB CONTENT 2: ARUS KAS & RINGKASAN UTAMA */}
      {activeSubTab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-1 bg-red-600 rounded-full"></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Likuiditas & Arus Kas</h3>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"
          >
            {/* SALDO KAS TUNAI */}
            <motion.div 
              variants={itemVariants}
              onClick={() => props.onNavigate('coa', undefined, 'Aset', 'Kas Tunai')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Klik untuk lihat detail Kas Tunai di COA"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-emerald-600 transition-colors">Saldo Kas Tunai</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {saldoKasTunai.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${kasTunaiTrend > 0 ? "text-emerald-600" : kasTunaiTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {kasTunaiTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : kasTunaiTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {kasTunaiTrend > 0 ? '+' : ''}{kasTunaiTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-emerald-600 rounded-b-xl" />
            </motion.div>

            {/* TOTAL SALDO BANK */}
            <motion.div 
              variants={itemVariants}
              onClick={() => props.onNavigate('coa', undefined, 'Aset', 'Bank')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Klik untuk lihat detail Rekening Bank di COA"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-blue-600 transition-colors">Total Saldo Bank</span>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Landmark className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {totalSaldoBank.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${bankTrend > 0 ? "text-emerald-600" : bankTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {bankTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : bankTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {bankTrend > 0 ? '+' : ''}{bankTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-blue-600 rounded-b-xl" />
            </motion.div>

            {/* TOTAL ASET LANCAR */}
            <motion.div 
              variants={itemVariants}
              onClick={() => props.onNavigate('coa', undefined, 'Aset', '')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Klik untuk lihat Chart of Accounts (COA)"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-teal-600 transition-colors">Total Aset Lancar</span>
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {totalAsetLancar.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${lancarTrend > 0 ? "text-emerald-600" : lancarTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {lancarTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : lancarTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {lancarTrend > 0 ? '+' : ''}{lancarTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-teal-600 rounded-b-xl" />
            </motion.div>

            {/* TOTAL ASET TIDAK LANCAR */}
            <motion.div 
              variants={itemVariants}
              onClick={() => props.onNavigate('coa', undefined, 'Aset', '')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Klik untuk lihat Chart of Accounts (COA)"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-amber-600 transition-colors">Total Aset Tetap</span>
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <Building className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {totalAsetTidakLancar.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${tidakLancarTrend > 0 ? "text-emerald-600" : tidakLancarTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {tidakLancarTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : tidakLancarTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {tidakLancarTrend > 0 ? '+' : ''}{tidakLancarTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-amber-600 rounded-b-xl" />
            </motion.div>

            {/* TOTAL PENJUALAN */}
            <motion.div 
              variants={itemVariants}
              onClick={() => props.onNavigate('inventori')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Lihat Mutasi Penjualan (Harian/Bulanan)"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-indigo-600 transition-colors">Penjualan Unit Toko</span>
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {penjualanCurrent.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${penjualanTrend > 0 ? "text-emerald-600" : penjualanTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {penjualanTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : penjualanTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {penjualanTrend > 0 ? '+' : ''}{penjualanTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-indigo-600 rounded-b-xl" />
            </motion.div>

            {/* PEMBELIAN / HPP */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer group"
              title="Lihat Mutasi Pembelian (Harian/Bulanan)"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase group-hover:text-orange-600 transition-colors">Pembelian Persediaan</span>
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900 tracking-tight">
                  Rp {pembelianCurrent.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className={`font-semibold flex items-center ${pembelianTrend > 0 ? "text-emerald-600" : pembelianTrend < 0 ? "text-rose-600" : "text-gray-500"}`}>
                    {pembelianTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : pembelianTrend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {pembelianTrend > 0 ? '+' : ''}{pembelianTrend.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">vs bln lalu</span>
                </div>
              </div>
              <div className="h-1 bg-orange-600 rounded-b-xl" />
            </motion.div>
          </motion.div>

          {/* RINGKASAN JATUH TEMPO (DUE DATE SUMMARY) WIDGET */}
          {(overdueInvoices.length > 0 || upcomingInvoices.length > 0) && (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              {overdueInvoices.length > 0 && (
                <div 
                  onClick={() => props.onNavigate('operasional')}
                  className="bg-rose-600 rounded-2xl p-4 shadow-xl shadow-rose-900/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <AlertTriangle className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-rose-100 uppercase tracking-[0.15em] mb-0.5">Tagihan Jatuh Tempo</h4>
                      <p className="text-xl font-black text-white leading-none">
                        {overdueInvoices.length} Tagihan • Rp {overdueInvoices.reduce((acc, c) => acc + c.jumlah, 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 group-hover:bg-white/20 transition-colors">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Tindak Lanjut</span>
                  </div>
                </div>
              )}

              {upcomingInvoices.length > 0 && (
                <div 
                  onClick={() => props.onNavigate('operasional')}
                  className="bg-amber-500 rounded-2xl p-4 shadow-xl shadow-amber-900/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-amber-50 uppercase tracking-[0.15em] mb-0.5">Mendekati Jatuh Tempo (7 Hari)</h4>
                      <p className="text-xl font-black text-white leading-none">
                        {upcomingInvoices.length} Tagihan • Rp {upcomingInvoices.reduce((acc, c) => acc + c.jumlah, 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 group-hover:bg-white/20 transition-colors">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Lihat Daftar</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* CHARTS & RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG CHART WITH SELECTABLE CHART TYPE */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-gray-50 gap-2">
            <h3 className="font-bold text-sm text-gray-800">Visualisasi Arus Kas Bulanan (2026)</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Legend */}
              <div className="flex gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="block w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Kas Masuk
                </div>
                <div className="flex items-center gap-1.5 text-red-650 text-red-600">
                  <span className="block w-2.5 h-2.5 rounded-sm bg-red-600" /> Kas Keluar
                </div>
              </div>
              
              {/* Chart Type Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['bar', 'line', 'area', 'pie'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setChartType(t)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition cursor-pointer select-none ${
                      chartType === t
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    {t === 'bar' ? 'Bar' : t === 'line' ? 'Line' : t === 'area' ? 'Area' : 'Pie'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full h-64 flex flex-col justify-between pt-4">
            {/* Background grid lines */}
            {chartType !== 'pie' && (
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-gray-400">
                <div className="w-full border-t border-dashed border-gray-100 flex justify-between pr-2"><span>{formatYAxis(scaleMax)}</span></div>
                <div className="w-full border-t border-dashed border-gray-100 flex justify-between pr-2"><span>{formatYAxis(scaleMax * 0.75)}</span></div>
                <div className="w-full border-t border-dashed border-gray-100 flex justify-between pr-2"><span>{formatYAxis(scaleMax * 0.5)}</span></div>
                <div className="w-full border-t border-dashed border-gray-100 flex justify-between pr-2"><span>{formatYAxis(scaleMax * 0.25)}</span></div>
                <div className="w-full border-t border-dashed border-gray-100 flex justify-between pr-2"><span>Rp 0</span></div>
              </div>
            )}

            {chartType === 'bar' ? (
              <div className="flex-1 w-full flex items-end justify-around relative z-10 pb-2 pl-8 animate-in fade-in duration-300">
                {barData.map((d, i) => {
                  const heightMasuk = (d.masuk / maxVal) * 100;
                  const heightKeluar = (d.keluar / maxVal) * 100;

                  return (
                    <div key={i} className="flex flex-col items-center w-14 group">
                      <div className="flex gap-1.5 items-end justify-center w-full h-44">
                        {/* Bar Green (Kas Masuk) */}
                        <div 
                          className="w-4 bg-emerald-600 hover:bg-emerald-500 rounded-t transition-all duration-300 relative group"
                          style={{ height: `${heightMasuk}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 shadow font-mono">
                            Rp {d.masuk.toLocaleString('id-ID')}
                          </div>
                        </div>
                        {/* Bar Red (Kas Keluar) */}
                        <div 
                          className="w-4 bg-red-600 hover:bg-red-500 rounded-t transition-all duration-300 relative group"
                          style={{ height: `${heightKeluar}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 shadow font-mono">
                            Rp {d.keluar.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      {/* Label */}
                      <span className="text-[11px] font-semibold text-gray-500 mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : chartType === 'pie' ? (
              <div className="flex-1 w-full relative z-10 flex flex-col md:flex-row items-center justify-around gap-6 select-none animate-in fade-in duration-300 pb-2">
                {renderDonut(masukPieData, totalMasukForPie, "Proporsi Kas Masuk", "#10b981")}
                {renderDonut(keluarPieData, totalKeluarForPie, "Proporsi Kas Keluar", "#ef4444")}
              </div>
            ) : (
              <div className="flex-1 w-full h-48 relative z-10 pl-8 pr-2 select-none animate-in fade-in duration-300 flex flex-col justify-between">
                <div className="w-full h-40">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    {chartType === 'area' && (
                      <>
                        <path d={areaPathMasuk} fill="url(#gradMasuk)" className="transition-all duration-500" />
                        <path d={areaPathKeluar} fill="url(#gradKeluar)" className="transition-all duration-500" />
                      </>
                    )}

                    {/* Line paths */}
                    <path 
                      d={linePathMasuk} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="transition-all duration-500"
                    />
                    <path 
                      d={linePathKeluar} 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="transition-all duration-500"
                    />

                    {/* Nodes (Dots) for "Kas Masuk" with custom interactive foreignObject tooltips */}
                    {ptsMasuk.map((p, idx) => (
                      <g key={`node-masuk-${idx}`} className="group/dot cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="5" 
                          fill="#10b981" 
                          className="stroke-white stroke-2 hover:r-7 transition-all duration-150" 
                        />
                        <foreignObject 
                          x={p.x - 55} 
                          y={p.y - 32} 
                          width="110" 
                          height="28" 
                          className="opacity-0 group-hover/dot:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-30 overflow-visible"
                        >
                          <div className="bg-gray-900 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow text-center border border-slate-700/50">
                            Masuk: Rp {barData[idx].masuk.toLocaleString('id-ID')}
                          </div>
                        </foreignObject>
                      </g>
                    ))}

                    {/* Nodes (Dots) for "Kas Keluar" */}
                    {ptsKeluar.map((p, idx) => (
                      <g key={`node-keluar-${idx}`} className="group/dot cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="5" 
                          fill="#ef4444" 
                          className="stroke-white stroke-2 hover:r-7 transition-all duration-150" 
                        />
                        <foreignObject 
                          x={p.x - 55} 
                          y={p.y - 32} 
                          width="110" 
                          height="28" 
                          className="opacity-0 group-hover/dot:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-30 overflow-visible"
                        >
                          <div className="bg-gray-900 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow text-center border border-slate-700/50">
                            Keluar: Rp {barData[idx].keluar.toLocaleString('id-ID')}
                          </div>
                        </foreignObject>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* X-Tick axis labels mapped perfectly with the coordinates */}
                <div className="grid grid-cols-5 text-center text-[11px] font-semibold text-gray-500 pb-1 mt-1">
                  {barData.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
            <h3 className="font-bold text-sm text-gray-800">Mutasi Mutakhir Terbaru</h3>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">LIVE UPDATE</span>
          </div>

          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto max-h-60 pr-1">
            {recentMutations.length === 0 ? (
              <div className="text-center py-8 px-4 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition duration-150">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2.5">
                  <Coins className="h-4 w-4 text-slate-400 group-hover:scale-115 transition" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Riwayat Mutasi</h4>
                <p className="text-[10px] text-slate-400 text-center max-w-[200px] mt-1 leading-normal">
                  Arus kas masih bersih. Pembukuan atau pencatatan transaksi pertama Anda akan muncul di sini.
                </p>
              </div>
            ) : (
              recentMutations.map((m, idx) => (
                <div 
                  key={idx} 
                  onClick={() => props.onNavigate('jurnal', m.no)}
                  className="py-3 flex items-start gap-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-all border border-transparent hover:border-slate-100"
                  title={`Klik untuk deteksi & cari No. Bukti ${m.no} di Jurnal`}
                >
                  <div className={`mt-0.5 p-1 rounded-full ${m.type === 'debet' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {m.type === 'debet' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1.5">
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-bold px-1 rounded">{m.no}</span>
                      <span className="truncate">{m.ket}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">{m.tgl}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${m.type === 'debet' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.type === 'debet' ? '+' : '-'} Rp {m.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50">
            <button 
              id="view-all-mutations"
              onClick={() => props.onNavigate('jurnal')}
              className="w-full text-center text-xs text-red-600 hover:text-red-700 font-semibold flex items-center justify-center gap-1"
            >
              Lihat Detail Jurnal Lengkap &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY PANELS: TOP SELLING PRODUCTS & INFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* COMPACT STYLISH KOMODITAS TERLARIS CARD */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-wider text-red-650 text-red-600">Terbanyak Terjual • {months[activeMonthIdx]} 2026</span>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">Komoditas &amp; Barang Terlaris</h3>
                {(rankedProducts.length > 0 || salesHistory.length > 0) && (
                  <button
                    id="btn-clear-all-sales-history"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearSalesHistory();
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 rounded-md transition duration-200 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="h-3 w-3" /> Kosongkan Semua
                  </button>
                )}
              </div>
            </div>
            <span className="p-2 bg-red-50 text-red-650 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28m-2.74 1.22L12 18.75l-3.005-3.005L1.5 22.5" />
              </svg>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedProducts.length === 0 ? (
              <div className="col-span-2 text-center py-10 px-5 flex flex-col items-center justify-center border border-dashed border-rose-200 rounded-xl bg-rose-50/10 hover:bg-rose-50/25 transition duration-150">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="h-6 w-6 text-red-600 animate-bounce" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Menunggu Penjualan Perdana</h4>
                <p className="text-[10.5px] text-slate-500 text-center max-w-sm mt-1 leading-normal">
                  Komoditas terlaris dihitung secara real-time berdasarkan penjualan kasir POS. Silakan buka menu <strong>POS Kasir Penjualan</strong> untuk mencatat penjualan perdana Anda.
                </p>
                <button
                  type="button"
                  onClick={() => props.onNavigate('invoice')}
                  className="mt-4 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="h-3 w-3" /> Rekam Penjualan POS Kasir
                </button>
              </div>
            ) : (
              rankedProducts.slice(0, 4).map((p, idx) => {
                const totalQtySold = rankedProducts.reduce((sum, curr) => sum + curr.qty, 0);
                const percent = totalQtySold > 0 ? (p.qty / totalQtySold) * 100 : 0;

                return (
                  <div key={idx} className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span className="text-[10px] bg-red-100 text-red-750 font-extrabold px-1.5 py-0.5 rounded-md text-red-700">#{idx + 1}</span> 
                          <span className="truncate" title={p.name}>{p.name}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProductHistory(p.name);
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                            title={`Hapus seluruh riwayat ${p.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-450 mt-1 font-mono">
                          {p.qty} Unit Terjual • Profit Rp {p.profit.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <span className="font-bold font-mono text-gray-950">
                          Rp {p.revenue.toLocaleString('id-ID')}
                        </span>
                        <div className="text-[9px] font-extrabold text-emerald-600 mt-0.5">
                          Margin {p.margin.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-650 h-full rounded-full bg-red-600" 
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SIDE BAR / VALUE ADD CARD */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] uppercase font-black text-red-400 tracking-wider">Performa Unit Ritel</span>
            <h3 className="text-sm font-extrabold text-white mt-1">E-Commerce &amp; Kasir Terintegrasi</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2.5">
              Analisis preferensi komoditas membantu pengurus menentukan alokasi pengadaan persediaan pupuk, bibit, dan obat tanaman yang optimal untuk meningkatkan SHU anggota.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between items-center text-xs">
            <span className="text-[10px] text-slate-400">Pembaruan: Real-time via POS</span>
            <button 
              onClick={() => props.onNavigate('rekappenjualan')}
              className="text-xs text-red-400 hover:text-red-350 font-bold flex items-center gap-1.5 bg-slate-850 px-3 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
            >
              Urus Rekap &rarr;
            </button>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* SUBTAB CONTENT 3: KALENDER & PERINGATAN PIUTANG */}
      {activeSubTab === 'operasional' && (
        <div className="space-y-6">
          {/* LOW STOCK ALERT WIDGET */}
          {lowStockItems.length > 0 && (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-500"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-rose-100/50 shadow-lg border border-rose-200">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-tight">Peringatan Stok Menipis</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded border border-rose-200">
                      CRITICAL: {lowStockItems.length} PRODUK
                    </span>
                    <span className="text-[10px] text-rose-700 font-bold uppercase tracking-tight">Segera lakukan pengisian ulang persediaan.</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex-none px-3 py-1.5 bg-white border border-rose-200 rounded-lg shadow-sm">
                    <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest leading-none">{item.kode}</p>
                    <p className="text-[11px] font-black text-slate-700 whitespace-nowrap mt-0.5">{item.nama}</p>
                    <p className="text-[10px] font-bold text-rose-600">Sisa: {item.qty}</p>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <div className="flex items-center px-2 text-[10px] font-black text-rose-400 uppercase">
                    +{lowStockItems.length - 3} Lainnya
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => props.onNavigate('inventory')}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 transition active:scale-95 cursor-pointer ml-auto md:ml-4 flex items-center gap-2"
                >
                  Kelola Stok <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* AUTOMATED BILLING STATUS WIDGET */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-100/50 shadow-lg border border-indigo-100">
                <RefreshCw className="h-6 w-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Automated Monthly Billing Status</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    <CheckCircle className="h-3 w-3" /> SYSTEM READY
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Terakhir Sinkron: 1 Jun 2026, 00:01 WIB</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Jadwal Rutin</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] font-black text-slate-700">Setiap Tanggal 1</p>
                  <Calendar className="h-3 w-3 text-slate-300" />
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
                className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" /> Trigger Manual
              </button>
            </div>
          </motion.div>

          {/* SECTION OPERATIONAL CALENDAR & WIDGET NOTICE PIUTANG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* OPERATIONAL CALENDAR (lg:col-span-2) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-red-650 text-red-600">Kalender Kas Makro (Operational Calendar)</span>
                <h3 className="text-sm font-extrabold text-slate-800">Visualisasi Intensitas Arus Kas Rekam Harian</h3>
              </div>
              <div className="p-2 bg-red-50 text-red-650 rounded-xl">
                <Calendar className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Dot warna menandakan intensitas transaksi harian di bulan <strong className="text-gray-700">{months[activeMonthIdx]} 2026</strong>. 
              Pilih tanggal untuk melihat rincian debet/kredit kas dan navigasi cari ke modul jurnal secara instan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* MINI CALENDAR GRID */}
              <div className="md:col-span-7">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  <div className="text-rose-500">Min</div>
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div>Jum</div>
                  <div className="text-blue-500 font-bold">Sab</div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty offsets */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-slate-50/20 rounded-lg border border-transparent" />
                  ))}

                  {/* Month Days */}
                  {Array.from({ length: maxDaysCurrentMonth }).map((_, i) => {
                    const d = i + 1;
                    const activity = dailyActivityMap[d] || { masuk: 0, keluar: 0, txCount: 0 };
                    const isSelected = d === clampedCalendarDay;
                    const hasActivity = activity.masuk > 0 || activity.keluar > 0;
                    
                    return (
                      <button
                        key={`day-${d}`}
                        type="button"
                        onClick={() => setSelectedCalendarDay(d)}
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-between p-1 cursor-pointer transition relative group active:scale-95 ${
                          isSelected
                            ? 'bg-red-600 border-red-700 text-white shadow-md'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className="text-[10.5px] font-mono font-bold leading-none">{d}</span>
                        
                        {/* Dot indicator indicators */}
                        {hasActivity && (
                          <div className="flex gap-0.5 justify-center mt-auto w-full">
                            {activity.masuk > 0 && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title={`Kas Masuk: Rp ${activity.masuk.toLocaleString('id-ID')}`} />
                            )}
                            {activity.keluar > 0 && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} title={`Kas Keluar: Rp ${activity.keluar.toLocaleString('id-ID')}`} />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DAY DETAIL CONTROLLER PANEL */}
              <div className="md:col-span-5 bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono tracking-wider">
                      Tanggal: {clampedCalendarDay} {months[activeMonthIdx]} 2026
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                      {selectedDayTransactions.length} Mutasi
                    </span>
                  </div>

                  <div className="mt-3 space-y-3 max-h-40 overflow-y-auto pr-1">
                    {selectedDayTransactions.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-400 font-medium">
                        Tidak ada catatan transaksi jurnal pada tanggal ini.
                      </div>
                    ) : (
                      selectedDayTransactions.map((tx, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs hover:border-slate-200 transition">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9.5px] uppercase font-extrabold bg-slate-150 text-slate-600 px-1 py-0.5 rounded leading-none font-mono">{tx.no}</span>
                            <span className={`text-[10.5px] font-black ${tx.debet > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              Rp {(tx.debet > 0 ? tx.debet : tx.kredit).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-700 leading-normal mt-1 truncate" title={tx.ket}>
                            {tx.ket}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
                            <span>Akun: {tx.akun}</span>
                            <span className={tx.debet > 0 ? "text-emerald-600" : "text-rose-600 font-semibold"}>({tx.debet > 0 ? "Debet" : "Kredit"})</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedDayTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const noFilter = selectedDayTransactions[0]?.no;
                      props.onNavigate('jurnal', noFilter);
                    }}
                    className="w-full mt-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Buka No. Bukti di Jurnal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INTEGRATED SUPPORT HUB / QUICK LINKS (Side Section) */}
        <div className="flex flex-col gap-6">
          <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-200 flex flex-col justify-between overflow-hidden relative group min-h-[220px] text-left">
            <LifeBuoy className="absolute -top-6 -right-6 h-32 w-32 text-indigo-500 opacity-20 rotate-12 transition-transform group-hover:rotate-45" />
            
            <div className="relative z-10">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Pusat Pengaduan</span>
              <h3 className="text-xl font-black text-white leading-tight mt-1">Butuh Bantuan Teknis?</h3>
              <p className="text-[11px] text-indigo-50 font-medium leading-relaxed mt-2 opacity-90">
                Hubungi tim developer SaaS kami jika Anda menemukan eror sistem, kendala akuntansi, atau pertanyaan seputar billing cloud.
              </p>
            </div>

            <button
              onClick={() => props.onNavigate('support')}
              className="mt-6 w-full py-3.5 bg-white text-indigo-700 text-[11px] font-black uppercase tracking-wider rounded-xl transition hover:bg-slate-50 active:scale-95 flex items-center justify-center gap-2 relative z-10"
            >
              <MessageSquare className="h-4 w-4" /> Buka Obrolan Support
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-amber-50 rounded-xl">
                <LayoutDashboard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Knowledge Base</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tutorial & Panduan</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] font-black text-slate-900 block truncate">Panduan Cepat Tutup Buku Bulanan</span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight flex items-center gap-1">Pelajari <ExternalLink className="h-2 w-2" /></span>
              </button>
              <button className="w-full text-left p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] font-black text-slate-900 block truncate">Efisiensi Input Stok & Penjualan</span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight flex items-center gap-1">Pelajari <ExternalLink className="h-2 w-2" /></span>
              </button>
            </div>
            
            <p className="mt-6 text-[10px] text-slate-400 font-medium italic text-center">
              Pusat bantuan kami aktif 24/7 untuk mendukung operasional koperasi digital Anda.
            </p>
          </div>
        </div>
      </div>
      </div>
      )}

      {activeSubTab === 'analisis_mendalam' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SCORECARD KESEHATAN FINANSIAL */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Financial Health Score
                </h3>
              </div>
              <div className="p-8 flex flex-col items-center justify-center flex-1">
                <div className="relative h-44 w-44 flex items-center justify-center">
                  <svg className="h-full w-full -rotate-90">
                    <circle cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    <circle cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-emerald-500" strokeDasharray={471} strokeDashoffset={471 - (471 * Math.min(100, (currentRatio/2 + netMargin*2 + 50))) / 100} strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900">{Math.min(100, Math.round(currentRatio/3 + netMargin*2 + 40))}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Overall Scored</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-wider mb-2">
                    {currentRatio >= 120 ? "Optimized Capital" : "Review Needed"}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                    Kombinasi likuiditas lancar ({currentRatio.toFixed(0)}%) dan efisiensi laba bersih ({netMargin.toFixed(1)}%) menunjukkan ketahanan koperasi yang sangat baik.
                  </p>
                </div>
              </div>
            </div>

            {/* BREAKDOWN RASIO PROFITABILITAS */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Efisiensi & Rasio Profitabilitas
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Performa 2026</span>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
                <div className="space-y-8">
                   <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gross Profit Margin</span>
                      <span className="text-base font-black text-slate-900">{grossMargin.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(2, grossMargin)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Profit Margin (SHU)</span>
                      <span className="text-base font-black text-slate-900">{netMargin.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(2, netMargin)}%` }} />
                    </div>
                  </div>
                   <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Return on Asset (ROA)</span>
                      <span className="text-base font-black text-slate-900">{roa.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(2, roa)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl shadow-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                      <Coins className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monthly Runway Est.</p>
                      <p className="text-sm font-black text-white mt-1">Rp {averageMonthlyExpense.toLocaleString('id-ID')} / Bln</p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-bold text-slate-300">Ketahanan Kas (Cash Runway)</span>
                      <span className="text-sm font-black text-amber-400">{runwayMonths.toFixed(1)} Bulan</span>
                    </div>
                    <div className="h-4 bg-white/10 border border-white/5 rounded-full overflow-hidden p-0.5">
                      <div className={`h-full rounded-full transition-all duration-1000 ${runwayMonths > 6 ? 'bg-emerald-500' : runwayMonths > 3 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, runwayMonths * 10)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 leading-relaxed opacity-80">Estimasi waktu koperasi dapat beroperasi hanya dengan kas <strong className="text-white">Rp {kasDanBank.toLocaleString('id-ID')}</strong> tanpa pendapatan baru sama sekali.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-500" />
                  Indikator Solvabilitas & Leverage
                </h4>
                <div className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 border border-slate-100">STABILITAS MODAL</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="h-12 w-12 text-slate-900" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Debt to Asset Ratio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{debtToAssetRatio.toFixed(1)}%</p>
                    <span className={`text-[10px] font-black uppercase ${debtToAssetRatio < 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {debtToAssetRatio < 50 ? "✓ Safe" : "⚠ Alert"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 leading-normal">Proporsi total aset yang dibiayai oleh utang/pinjaman luar.</p>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="h-12 w-12 text-slate-900" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Debt to Equity Ratio</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{debtToEquityRatio.toFixed(1)}%</p>
                    <span className={`text-[10px] font-black uppercase ${debtToEquityRatio < 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {debtToEquityRatio < 100 ? "✓ Healthy" : "⚠ High"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 leading-normal">Rasio perbandingan antara total utang dengan modal sendiri (Ekuitas).</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl shadow-indigo-100">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">AI Financial Advisory</h4>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 text-[10px] font-bold border border-white/10">1</div>
                    <p className="text-[11px] text-indigo-50 leading-relaxed font-medium">Jaga <strong className="text-white">Margin SHU</strong> di atas 15% untuk ekspansi unit bisnis baru di tahun depan.</p>
                  </div>
                   <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 text-[10px] font-bold border border-white/10">2</div>
                    <p className="text-[11px] text-indigo-50 leading-relaxed font-medium">Optimalkan piutang lancar untuk memperkuat <strong className="text-white">Cash Runway</strong> koperasi.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Financial AI v4.0</span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/5">
                   DATA LIVE RECAP
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* KUSTOM KONFIRMASI RESET MODAL */}
      {showResetConfirm && (
        <div id="reset-confirm-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-5 text-white ${showResetConfirm === 'zero' ? 'bg-red-600' : 'bg-emerald-600'}`}>
              <div className="flex items-center gap-3">
                {showResetConfirm === 'zero' ? (
                  <div className="p-2 bg-white/25 rounded-lg">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className="p-2 bg-white/25 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base">
                    {showResetConfirm === 'zero' ? 'Konfirmasi Reset Pembukuan (Nol)' : 'Konfirmasi Pulihkan Demo'}
                  </h3>
                  <p className="text-xs text-white/80">Konfirmasi keamanan sistem koperasi</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {showResetConfirm === 'zero' ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                    Apakah Anda yakin ingin MERISET semua angka pada COA, Jurnal, dan Dashboard menjadi Rp 0 (Mulai pembukuan baru)?
                  </p>
                  <ul className="text-[11px] text-red-700 space-y-1 list-disc list-inside bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                    <li>Semua akun Chart of Accounts (COA) disetel ulang menjadi saldo Rp 0.</li>
                    <li>Seluruh catatan Jurnal Umum / Ledger dihapus bersih.</li>
                    <li>Stok barang dagang diperbarui menjadi 0 qty.</li>
                    <li>Sempurna untuk memulai entri pembukuan riil dari awal.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                    Apakah Anda yakin ingin memulihkan seluruh data koperasi ke Data Simulasi Demo semula?
                  </p>
                  <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium">
                    <li>Data Jurnal Umum simulasi default akan dikembalikan.</li>
                    <li>Suhu neraca dan COA diatur ulang dengan balance default.</li>
                    <li>Sempurna untuk mendemonstrasikan simulasi secara interaktif.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                id="modal-cancel-btn"
                type="button"
                onClick={() => setShowResetConfirm(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-gray-700 text-xs font-bold rounded-lg transition duration-150 cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                id="modal-confirm-btn"
                type="button"
                onClick={() => {
                  if (props.onResetData) {
                    props.onResetData(showResetConfirm === 'zero');
                  }
                  setShowResetConfirm(null);
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition duration-150 cursor-pointer active:scale-95 ${
                  showResetConfirm === 'zero' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {showResetConfirm === 'zero' ? 'Ya, Reset Sekarang' : 'Ya, Pulihkan Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
