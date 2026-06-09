/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Printer, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  Layers, 
  CheckCircle, 
  FileText, 
  ArrowLeft, 
  X, 
  Share2,
  Trash2,
  Undo,
  FileDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { StokItem, CoaAccount, CoaKategori, PastSale } from '../types';

interface RekapPenjualanProps {
  stokData: StokItem[];
  coaData: CoaAccount[];
  salesHistory: PastSale[];
  onUpdateSalesHistory: React.Dispatch<React.SetStateAction<PastSale[]>>;
  accessMode: "admin" | "view";
  koperasiId?: string;
  onUpdateStok?: (id: string, newQty: number, reason?: string) => void;
  onAddJurnal?: (tgl: string, no: string, ket: string, entries: { akun: string; debet: number; kredit: number }[]) => void;
}

export function RekapPenjualan(props: RekapPenjualanProps) {
  // Load and state for sales history loaded from props (synchronized to Cloud)
  const salesList = props.salesHistory;
  const setSalesList = props.onUpdateSalesHistory;
  
  // Date selection states
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 0-indexed: May=4, June=5 (Default June)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected sale for receipt viewing
  const [selectedReceipt, setSelectedReceipt] = useState<PastSale | null>(null);

  // Form input states for adding new cashier recap entries representing a full month period
  const [inputMonth, setInputMonth] = useState<number>(5); // Default to June (index 5)
  const [inputYear, setInputYear] = useState<number>(2026); // Default 2026
  const [inputKasir, setInputKasir] = useState("");
  const [inputPayment, setInputPayment] = useState("1-1101"); // Default Kas Tunai
  const [selectedStokId, setSelectedStokId] = useState("");
  const [customProdukNama, setCustomProdukNama] = useState("");
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [inputQty, setInputQty] = useState<number>(1);
  const [inputHarga, setInputHarga] = useState<number>(0);
  const [inputDiskon, setInputDiskon] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Populate first available item automatically or fallback
  useEffect(() => {
    if (props.stokData && props.stokData.length > 0) {
      setSelectedStokId(props.stokData[0].id);
      setInputHarga(props.stokData[0].hargaJual);
      setIsCustomProduct(false);
    } else {
      setSelectedStokId("custom");
      setInputHarga(0);
      setIsCustomProduct(true);
    }
  }, [props.stokData]);

  const handleStokChange = (stokId: string) => {
    setSelectedStokId(stokId);
    if (stokId === "custom") {
      setIsCustomProduct(true);
      setInputHarga(0);
    } else {
      setIsCustomProduct(false);
      const match = props.stokData.find(s => s.id === stokId);
      if (match) {
        setInputHarga(match.hargaJual);
      }
    }
  };

  const handleAddRecapRow = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!inputKasir.trim()) {
      setErrorMessage("Nama kasir wajib diisi.");
      return;
    }
    
    let pName = "";
    let activeModal = 0;
    
    if (isCustomProduct) {
      if (!customProdukNama.trim()) {
        setErrorMessage("Nama barang/keterangan manual wajib ditulis.");
        return;
      }
      pName = customProdukNama.trim();
      activeModal = Math.round(inputHarga * 0.75); // fallback to 75% HPP
    } else {
      const selectedItem = props.stokData.find(s => s.id === selectedStokId);
      if (!selectedItem) {
        setErrorMessage("Silakan pilih komoditas barang.");
        return;
      }
      pName = selectedItem.nama;
      activeModal = selectedItem.hargaModal || Math.round(selectedItem.hargaJual * 0.75);
    }
    
    if (inputQty <= 0) {
      setErrorMessage("Kuantitas (Qty) harus minimal 1 pcs.");
      return;
    }
    if (inputHarga < 0) {
      setErrorMessage("Harga jual tidak boleh negatif.");
      return;
    }

    const sub = inputQty * inputHarga;
    const cleanedDiscount = Math.max(0, inputDiskon);
    const calculatedTotal = Math.max(0, sub - cleanedDiscount);

    // Compute synthetic date representing the full month period (1st of the month)
    const generatedTgl = `${inputYear}-${String(inputMonth + 1).padStart(2, "0")}-01`;
    const datePart = `${inputYear}${String(inputMonth + 1).padStart(2, "0")}`;
    const totalToday = salesList.filter(s => s.id.startsWith(`PJ-REKAP-${datePart}`)).length + 1;
    const generatedId = `PJ-REKAP-${datePart}-${String(totalToday).padStart(3, "0")}`;

    const paymentName = props.coaData.find(c => c.kode === inputPayment)?.nama || "Kas/Bank";

    const newRecord: PastSale = {
      id: generatedId,
      tgl: generatedTgl,
      customerNama: `Kasir: ${inputKasir.trim()}`,
      paymentCoa: inputPayment,
      paymentName: paymentName,
      subtotal: sub,
      tax: 0,
      discount: cleanedDiscount,
      total: calculatedTotal,
      cashReceived: calculatedTotal,
      change: 0,
      items: [
        {
          nama: pName,
          qty: inputQty,
          hargaJual: inputHarga,
          stokId: isCustomProduct ? undefined : selectedStokId,
          hargaModal: activeModal
        }
      ]
    };

    // AUTOMATIC JOURNALING (INTEGRATION)
    if (props.onAddJurnal) {
      // 1. Journal for Revenue and Cash/Bank Reception
      // DEBIT: Selected Payment Account (Asset)
      // CREDIT: Pendapatan Penjualan (4-1001)
      props.onAddJurnal(
        generatedTgl,
        generatedId,
        `Rekap Penjualan Kasir (${inputKasir}) - ${pName}`,
        [
          { akun: inputPayment, debet: calculatedTotal, kredit: 0 },
          { akun: "4-1001", debet: 0, kredit: calculatedTotal }
        ]
      );

      // 2. Journal for HPP (Cost of Goods Sold) and Inventory reduction
      // DEBIT: Harga Pokok Penjualan (5-1001)
      // CREDIT: Persediaan Barang Dagangan (1-1301)
      const totalHppForThisRow = inputQty * activeModal;
      if (totalHppForThisRow > 0) {
        props.onAddJurnal(
          generatedTgl,
          `HPP-${generatedId}`,
          `Pencatatan HPP Penjualan (${pName}) - ${generatedId}`,
          [
            { akun: "5-1001", debet: totalHppForThisRow, kredit: 0 },
            { akun: "1-1301", debet: 0, kredit: totalHppForThisRow }
          ]
        );
      }
    }

    const nextSales = [newRecord, ...salesList];
    setSalesList(nextSales);

    // DECREMENT STOCK GUDANG (User Requirement)
    if (!isCustomProduct && props.onUpdateStok) {
      const match = props.stokData.find(s => s.id === selectedStokId);
      if (match) {
        const remainingQty = Math.max(0, match.qty - inputQty);
        props.onUpdateStok(selectedStokId, remainingQty, `Rekap Penjualan Kasir (${inputKasir}) - Nota: ${generatedId}`);
      }
    }

    // Clear and restore states appropriately
    setInputKasir("");
    setCustomProdukNama("");
    setInputQty(1);
    setInputDiskon(0);
    // Restore selection
    if (props.stokData && props.stokData.length > 0) {
      setSelectedStokId(props.stokData[0].id);
      setInputHarga(props.stokData[0].hargaJual);
      setIsCustomProduct(false);
    } else {
      setSelectedStokId("custom");
      setInputHarga(0);
      setIsCustomProduct(true);
    }

    setSuccessMessage(`Berhasil menyimpan rekap penjualan bulanan kasir untuk ID ${generatedId}!`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Filter list of sales to the selected month and year
  const activeMonthSales = salesList.filter(sale => {
    const parts = sale.tgl.split('-');
    if (parts.length >= 2) {
      const saleYear = parseInt(parts[0], 10);
      const saleMonth = parseInt(parts[1], 10) - 1; // 0-indexed
      return saleYear === selectedYear && saleMonth === selectedMonth;
    }
    return false;
  });

  // Calculate high level KPI Metrics
  let totalGrossRevenue = 0;
  let totalHppCost = 0;
  let totalTrans = activeMonthSales.length;

  activeMonthSales.forEach(sale => {
    totalGrossRevenue += sale.total;
    
    // For each item in the sale, compute HPP
    sale.items.forEach(item => {
      let activeHppValue = 0;
      if (item.hargaModal !== undefined) {
        activeHppValue = item.hargaModal;
      } else {
        // Look up item modal inside props.stokData
        const matchedItem = props.stokData.find(s => s.nama === item.nama || s.id === item.stokId);
        if (matchedItem && matchedItem.hargaModal) {
          activeHppValue = matchedItem.hargaModal;
        } else {
          // fallback to 75% of sales price
          activeHppValue = Math.round(item.hargaJual * 0.75);
        }
      }
      totalHppCost += (item.qty * activeHppValue);
    });
  });

  const totalGrossProfit = totalGrossRevenue - totalHppCost;
  const averageMargin = totalGrossRevenue > 0 ? (totalGrossProfit / totalGrossRevenue) * 100 : 0;
  const averageTransVal = totalTrans > 0 ? Math.round(totalGrossRevenue / totalTrans) : 0;

  // Compute Opname Reconciliation (New for Monthly recap accuracy)
  // This calculates how much stock is "lost" or "found" based on the monthly stock count vs theoretical sales
  const computeOpnameVariance = () => {
    // This would ideally fetch from a persistent opname history
    // For now, calculating based on current stokData discrepancies if min_stok is used as flag
    const variances = props.stokData.filter(s => (s as any).lastVariance !== 0);
    return variances.reduce((sum, s) => sum + (Math.abs((s as any).lastVariance || 0) * (s.hargaModal || 0)), 0);
  };

  const monthlyVarianceLoss = computeOpnameVariance();

  // Process data for Recharts (Daily Sales of the month)
  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);
  const chartData = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = String(dayNum).padStart(2, "0");
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${dayStr}`;
    
    const daySales = activeMonthSales.filter(s => s.tgl === formattedDate);
    const dayTotal = daySales.reduce((acc, curr) => acc + curr.total, 0);

    return {
      tanggal: `${dayNum}`,
      Penjualan: dayTotal
    };
  });

  // Compile top products ranking
  const productSalesMap: Record<string, { qty: number; revenue: number; hpp: number }> = {};
  activeMonthSales.forEach(sale => {
    sale.items.forEach(item => {
      const pName = item.nama;
      let mCost = 0;
      if (item.hargaModal !== undefined) {
        mCost = item.hargaModal;
      } else {
        const mat = props.stokData.find(s => s.nama === item.nama || s.id === item.stokId);
        mCost = mat && mat.hargaModal ? mat.hargaModal : Math.round(item.hargaJual * 0.75);
      }

      if (!productSalesMap[pName]) {
        productSalesMap[pName] = { qty: 0, revenue: 0, hpp: 0 };
      }
      productSalesMap[pName].qty += item.qty;
      productSalesMap[pName].revenue += (item.qty * item.hargaJual);
      productSalesMap[pName].hpp += (item.qty * mCost);
    });
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

  // Filter transaction records by query (customer or transaction ID)
  const filteredTransactions = activeMonthSales.filter(sale => 
    sale.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sale.customerNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.paymentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper clear log item (admin only)
  const handleDeleteSale = (id: string) => {
    if (props.accessMode !== "admin") {
      alert("Akses ditolak: Hanya administrator yang dapat menghapus rincian sales history.");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menghapus log penjualan ini dari sejarah rekap bulanan? (Tindakan ini tidak membatalkan transaksi jurnal atau mengembalikan stok fisik)")) {
      const upd = salesList.filter(s => s.id !== id);
      setSalesList(upd);
      if (selectedReceipt && selectedReceipt.id === id) {
        setSelectedReceipt(null);
      }
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Rekap Penjualan Bulanan Periode ${months[selectedMonth]} ${selectedYear}\r\n`;
    csvContent += "ID Transaksi,Tanggal,Customer / Kasir,Metode Pembayaran,Subtotal (Rp),Diskon (Rp),Total Bersih (Rp),Barang,Qty,Harga Jual Satuan (Rp)\r\n";
    
    filteredTransactions.forEach(sale => {
      sale.items.forEach(item => {
        const row = [
          `"${sale.id}"`,
          `"${sale.tgl}"`,
          `"${sale.customerNama.replace(/"/g, '""')}"`,
          `"${sale.paymentName}"`,
          sale.subtotal.toString(),
          sale.discount.toString(),
          sale.total.toString(),
          `"${item.nama.replace(/"/g, '""')}"`,
          item.qty.toString(),
          item.hargaJual.toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `REKAP_PENJUALAN_${months[selectedMonth].toUpperCase()}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* PRINT-ONLY AREA */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-invoice-receipt {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-red-100 no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6.5 w-6.5 text-red-600 animate-pulse" /> Rekap Penjualan Bulanan
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Analisis profitabilitas unit toko, ukur performa omset bulanan, dan evaluasi kontribusi komoditas persediaan terlaris.
          </p>
        </div>

        {/* PRINT & EXPORT BUTTON */}
        <div className="flex gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition transform active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
            title="Download sales log for selected month as CSV"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
        </div>
      </div>

      {/* FILTER & DATE CONTROLLER BAR */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Pilih Bulan Recap
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-bold text-gray-800 bg-slate-50 hover:bg-slate-100 transition"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Tahun</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 font-bold text-gray-800 bg-slate-50 hover:bg-slate-100 transition"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500 bg-slate-50 p-2.5 rounded-xl border border-dashed border-gray-200">
          <p className="font-semibold">Mencakup periode:</p>
          <p className="font-mono text-gray-950 font-bold text-[11px] mt-0.5">
            01 {months[selectedMonth]} {selectedYear} s/d {daysInCurrentMonth} {months[selectedMonth]} {selectedYear}
          </p>
        </div>
      </div>

      {/* CASHIER SALES INPUT TABLE (NEW FEATURE) */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-black text-red-650 tracking-wider">Entri Data Manual</span>
            <h3 className="text-sm font-bold text-slate-800">Tabel Input Rekap Penjualan Kasir</h3>
          </div>
          <span className="text-[10px] text-gray-450 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
            Periode Aktif: <strong>{months[selectedMonth]} {selectedYear}</strong>
          </span>
        </div>

        {/* FEEDBACK MESSAGES */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in duration-200">
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 text-xs font-bold rounded-xl">
            ⚠ {errorMessage}
          </div>
        )}

        {/* INPUT GRID TABLE ROW FORM */}
        <form onSubmit={handleAddRecapRow} className="space-y-4">
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-50/70 p-4">
            <div className="min-w-[900px] grid grid-cols-12 gap-3 items-end text-xs">
              {/* PERIOD SELECTOR */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Periode Rekap</label>
                <div className="flex gap-1">
                  <select
                    value={inputMonth}
                    onChange={(e) => setInputMonth(parseInt(e.target.value, 10))}
                    className="w-1/2 px-1 py-1.5 text-[11px] border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold bg-white text-gray-800"
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx}>{m.substring(0, 3)}</option>
                    ))}
                  </select>
                  <select
                    value={inputYear}
                    onChange={(e) => setInputYear(parseInt(e.target.value, 10))}
                    className="w-1/2 px-1 py-1.5 text-[11px] border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold bg-white text-gray-800"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* CASHIER */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Nama Kasir</label>
                <input
                  type="text"
                  placeholder="Misal: Kasir Desi"
                  value={inputKasir}
                  onChange={(e) => setInputKasir(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-350 rounded-lg focus:outline-none focus:border-red-500 font-medium bg-white"
                />
              </div>

              {/* PAYMENT METHOD */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Metode Bayar / Kas</label>
                <select
                  value={inputPayment}
                  onChange={(e) => setInputPayment(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold bg-white text-gray-800"
                >
                  {props.coaData
                    .filter(c => c.kode.startsWith("1-11")) // Filter for Kas & Bank specifically
                    .map(c => (
                      <option key={c.kode} value={c.kode}>{c.nama} ({c.kode})</option>
                    ))
                  }
                </select>
              </div>

              {/* PRODUCTS / ITEMS DROPDOWN */}
              <div className={`${isCustomProduct ? 'col-span-2' : 'col-span-3'} flex flex-col gap-1.5`}>
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Pilih Komoditas / Barang</label>
                <select
                  value={selectedStokId}
                  onChange={(e) => handleStokChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium bg-white text-gray-800"
                >
                  {props.stokData.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} (Rp {s.hargaJual.toLocaleString('id-ID')})</option>
                  ))}
                  <option value="custom">-- Ketik Manual / Komoditi Lain --</option>
                </select>
              </div>

              {/* IF MANUAL TYPE */}
              {isCustomProduct && (
                <div className="col-span-2 flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-150">
                  <label className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Nama Barang Manual</label>
                  <input
                    type="text"
                    placeholder="Contoh: ATK / Biaya kemas"
                    value={customProdukNama}
                    onChange={(e) => setCustomProdukNama(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-red-200 focus:border-red-500 rounded-lg focus:outline-none font-medium bg-white"
                  />
                </div>
              )}

              {/* QUANTITY */}
              <div className="col-span-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Qty (Pcs)</label>
                <input
                  type="number"
                  min={1}
                  value={inputQty}
                  onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold bg-white text-center"
                />
              </div>

              {/* UNIT PRICE */}
              <div className="col-span-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Harga (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={inputHarga}
                  onChange={(e) => setInputHarga(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  disabled={!isCustomProduct && props.accessMode !== "admin"}
                  className={`w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold text-right ${
                    !isCustomProduct && props.accessMode !== "admin" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>

              {/* REFAKSI DISCOUNT */}
              <div className="col-span-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider block">Diskon (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={inputDiskon}
                  onChange={(e) => setInputDiskon(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-bold bg-white text-right"
                />
              </div>

              {/* SAVE BUTTON */}
              <div className="col-span-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-red-600 text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer text-center shadow-xs"
                >
                  + Rekap
                </button>
              </div>
            </div>
            
            {/* INLINE ESTIMATE SUMMARY */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
              <div className="italic">
                * Nota POS baru otomatis terpublikasikan dengan format ID: <strong className="font-mono text-slate-900">PJ-REKAP-{inputYear}{String(inputMonth + 1).padStart(2, "0")}-xxx</strong>
              </div>
              <div className="flex gap-4 font-mono font-bold">
                <span>Subtotal: <strong className="text-gray-900 text-xs">Rp {((inputQty * inputHarga)).toLocaleString('id-ID')}</strong></span>
                {inputDiskon > 0 && <span className="text-rose-600">Diskon: <strong>-Rp {inputDiskon.toLocaleString('id-ID')}</strong></span>}
                <span className="text-slate-950 bg-red-55 px-2 bg-red-100 py-0.5 rounded">
                  Grand Total Estimasi: <strong className="text-red-700">Rp {Math.max(0, (inputQty * inputHarga) - inputDiskon).toLocaleString('id-ID')}</strong>
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* REVENUE CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Total Omset Kotor</span>
            <span className="px-2 py-0.5 bg-red-100 text-[9px] font-bold text-red-700 rounded-md">Total Jual</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-mono text-slate-900">
              Rp {totalGrossRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[9.5px] font-medium text-slate-400 mt-1">
              Akumulasi nota POS terekam.
            </p>
          </div>
        </div>

        {/* HPP COST CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Total HPP / Modal</span>
            <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-700 rounded-md">Beban Stok</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-mono text-slate-800">
              Rp {totalHppCost.toLocaleString('id-ID')}
            </h3>
            <p className="text-[9.5px] font-medium text-slate-400 mt-1">
              Biaya modal pupuk/bibit terjual.
            </p>
          </div>
        </div>

        {/* GROSS PROFIT CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Laba Kotor Toko</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-[9px] font-bold text-emerald-700 rounded-md">Margin Laba</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-mono text-emerald-700">
              Rp {totalGrossProfit.toLocaleString('id-ID')}
            </h3>
            <p className="text-[9.5px] font-medium text-slate-400 mt-1">
              Selisih pendapatan dgn nilai HPP.
            </p>
          </div>
        </div>

        {/* MARGIN PERCENTAGE CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Margin Keuntungan</span>
            <span className="px-2 py-0.5 bg-amber-100 text-[9px] font-bold text-amber-700 rounded-md">Profitabilitas</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-mono text-slate-900">
              {averageMargin.toFixed(1)}%
            </h3>
            <p className="text-[9.5px] font-medium text-slate-400 mt-1 flex items-center gap-0.5">
              Rata-rata profit bersih komoditas.
            </p>
          </div>
        </div>

        {/* AVERAGE OR COUNT CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Sesi Transaksi</span>
            <span className="px-2 py-0.5 bg-blue-100 text-[9px] font-bold text-blue-700 rounded-md">Keranjang</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-mono text-slate-900">
              {totalTrans} Nota
            </h3>
            <p className="text-[9.5px] font-medium text-slate-500 mt-1 font-sans">
              Ø Tiket: Rp {averageTransVal.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* RECONCILIATION VARIANCE CARD (New professional banking metric) */}
        <div className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${monthlyVarianceLoss > 0 ? 'bg-orange-50 border-orange-150' : 'bg-white border-gray-150'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Nilai Shrinkage / Opname</span>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${monthlyVarianceLoss > 0 ? 'bg-orange-200 text-orange-900' : 'bg-emerald-100 text-emerald-700'}`}>
              {monthlyVarianceLoss > 0 ? 'Resiko Stok' : 'Stok Akurat'}
            </span>
          </div>
          <div>
            <h3 className={`text-xl font-extrabold font-mono ${monthlyVarianceLoss > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
              Rp {monthlyVarianceLoss.toLocaleString('id-ID')}
            </h3>
            <p className="text-[9.5px] font-medium text-slate-400 mt-1">
              Potensi kerugian dari selisih fisik gudang.
            </p>
          </div>
        </div>
      </div>

      {/* TRANSACTION LIST VIEW */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden no-print">
        
        {/* TOOLBAR */}
        <div className="p-5 bg-slate-50 border-b border-gray-150 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Log Buku Kasir</h4>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              Rincian Ringkasan Penjualan ({activeMonthSales.length} Sesi Terdaftar)
            </h3>
          </div>

          <div className="relative w-full md:max-w-sm">
            <span className="absolute left-3 top-2.5 text-gray-450 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari No Nota, Pembeli, atau Pembayaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-gray-250 bg-white/60 focus:bg-white rounded-lg focus:outline-none focus:border-red-500 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-650 text-sm font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-[130px]">No Nota</th>
                <th className="py-3.5 px-4 w-[110px]">Tanggal</th>
                <th className="py-3.5 px-4">Nama Pelanggan / Pembeli</th>
                <th className="py-3.5 px-4 w-[150px]">Metode Pembayaran</th>
                <th className="py-3.5 px-4 text-center w-[100px]">Total Produk</th>
                <th className="py-3.5 px-4 text-right w-[150px]">Grand Total</th>
                <th className="py-3.5 px-4 text-center w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Tidak ada transaksi penjualan ritel yang cocok dengan rentang atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((sale) => {
                  const itemsCount = sale.items.reduce((sum, i) => sum + i.qty, 0);
                  
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition duration-150">
                      {/* Sale ID */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-blue-650">
                        {sale.id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-600 font-medium font-mono">
                        {sale.tgl}
                      </td>

                      {/* Customer name */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {sale.customerNama}
                      </td>

                      {/* Pay account */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          sale.paymentCoa.includes("1-1101") 
                            ? "bg-slate-100 text-slate-700 border border-slate-200" 
                            : "bg-blue-50 text-blue-800 border border-blue-100"
                        }`}>
                          {sale.paymentName}
                        </span>
                      </td>

                      {/* Items count */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {itemsCount} Pcs
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-gray-900">
                        Rp {sale.total.toLocaleString('id-ID')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(sale)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 p-1.5 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" /> Lihat Nota
                          </button>
                          {props.accessMode === "admin" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(sale.id)}
                              className="text-gray-400 hover:text-red-650 p-1.5 hover:bg-slate-100 rounded-lg transition transition-colors"
                              title="Hapus Penjualan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPACT FLOATING VIEW INVOICE DETAILED RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 no-print">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-red-500 animate-bounce" />
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-400 leading-none">Rincian Dokumen POS</h3>
                  <h2 className="text-sm font-black text-white mt-1 uppercase font-mono">{selectedReceipt.id}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Frame Area inside Modal */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
              <div 
                id="printable-invoice-receipt" 
                className="bg-white border rounded-xl p-5 shadow-sm space-y-4 text-[11px] text-gray-800 text-left font-sans"
              >
                {/* Header Kop */}
                <div className="text-center pb-3 border-b border-dashed border-gray-250">
                  <h4 className="text-sm font-black text-gray-900 tracking-wide">FINANCIAL SYSTEM</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Unit Bisnis & Solusi Digital</p>
                  <p className="text-[9px] text-gray-400 italic">Enterprise Resource Planning Systems</p>
                </div>

                {/* Metadata block */}
                <div className="space-y-1 text-gray-600 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span>No Nota :</span>
                    <span className="font-bold text-gray-900">{selectedReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal :</span>
                    <span className="text-gray-900">{selectedReceipt.tgl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan :</span>
                    <span className="font-bold text-gray-900">{selectedReceipt.customerNama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir/Akun :</span>
                    <span className="text-gray-900">{selectedReceipt.paymentName} ({selectedReceipt.paymentCoa})</span>
                  </div>
                </div>

                {/* Items and prices list */}
                <div className="border-t border-b border-dashed border-gray-250 py-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-450">Daftar Pembelian:</p>
                  
                  {selectedReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{it.nama}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {it.qty} Pcs x Rp {it.hargaJual.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-gray-950 mt-1">
                        Rp {(it.qty * it.hargaJual).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary block */}
                <div className="space-y-1.5 font-semibold text-xs border-b border-dashed border-gray-250 pb-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Sales Subtotal</span>
                    <span className="font-mono">Rp {selectedReceipt.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedReceipt.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Refaksi Diskon</span>
                      <span className="font-mono">-Rp {selectedReceipt.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {selectedReceipt.tax > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Pajak PPN (11%)</span>
                      <span className="font-mono">Rp {selectedReceipt.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t">
                    <span>Total Bersih</span>
                    <span className="font-mono text-base text-red-650">Rp {selectedReceipt.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Cash payment blocks */}
                <div className="space-y-1 font-mono text-[10px] text-gray-500">
                  <div className="flex justify-between">
                    <span>Dibayar Tunai/Kartu</span>
                    <span>Rp {selectedReceipt.cashReceived.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Uang Kembalian (Kembali)</span>
                    <span className="text-emerald-700 font-bold">Rp {selectedReceipt.change.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Footer memo text */}
                <div className="text-center pt-3 border-t border-dashed border-gray-200">
                  <p className="font-bold text-[10px] text-gray-800">Sistem Kasir Ritel POS Desktop</p>
                  <p className="text-[8.5px] text-gray-400 mt-0.5 italic text-center">Status Nota: SAH (LUNAS). Terima kasih atas kepercayaan Anda menggunakan layanan kami.</p>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-slate-100 border-t flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    const printableHtml = `
                      <html>
                        <head>
                          <title>Cetak Nota POS - ${selectedReceipt.id}</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; text-align: left; background: #fff; }
                            #printable-invoice-receipt { max-width: 320px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
                            .text-center { text-align: center; }
                            .flex { display: flex; justify-content: space-between; }
                            .border-b { border-bottom: 1px dashed #aaa; padding-bottom: 10px; margin-bottom: 15px; }
                            .font-mono { font-family: monospace; }
                            .space-y { margin-bottom: 8px; }
                          </style>
                        </head>
                        <body>
                          ${document.getElementById('printable-invoice-receipt')?.outerHTML || ''}
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    `;
                    printWin.document.write(printableHtml);
                    printWin.document.close();
                  }
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Thermal (PDF)
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 font-extrabold text-xs py-2.5 rounded-lg text-center cursor-pointer"
              >
                Tutup Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
