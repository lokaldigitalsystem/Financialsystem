/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  FileDown,
  RefreshCw
} from 'lucide-react';
import { StokItem, Anggota, RekeningBank, CoaAccount } from '../types';

interface PenjualanProps {
  stokData: StokItem[];
  anggotaData: Anggota[];
  rekeningData: RekeningBank[];
  coaData: CoaAccount[];
  accessMode: "admin" | "view";
  onRecordSale: (
    tgl: string,
    no: string,
    customerNama: string,
    methodCoaKode: string,
    items: { stokId: string; qty: number; hargaJual: number; hargaModal: number }[]
  ) => Promise<void>;
  koperasiName?: string;
  koperasiId?: string;
}

interface CartItem {
  stokId: string;
  kode: string;
  nama: string;
  hargaJual: number;
  hargaModal: number;
  qty: number;
  maxStock: number;
}

interface PastSale {
  id: string; // PJ-xxxx
  tgl: string;
  customerNama: string;
  paymentCoa: string;
  paymentName: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cashReceived: number;
  change: number;
  items: {
    nama: string;
    qty: number;
    hargaJual: number;
  }[];
}

export function Penjualan(props: PenjualanProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"kasir" | "riwayat">("kasir");

  // State for Catalog / Search
  const [searchQuery, setSearchQuery] = useState("");

  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Transaction input states
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleNo, setSaleNo] = useState("");
  const [selectedPelangganId, setSelectedPelangganId] = useState("tamu");
  const [selectedPayCoa, setSelectedPayCoa] = useState("");
  const [customPelangganName, setCustomPelangganName] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [noteMsg, setNoteMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modal states
  const [showConfirmDeleteSaleId, setShowConfirmDeleteSaleId] = useState<string | null>(null);

  // Receipt modal states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<PastSale | null>(null);

  const storageKey = props.koperasiId ? `kdmp_${props.koperasiId}_salesHistory` : 'kdmp_salesHistory';

  // Past Sales History list (stored in localStorage session)
  const [salesHistory, setSalesHistory] = useState<PastSale[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load sales history from localStorage:", e);
      return [];
    }
  });

  // Sync sales history to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(salesHistory));
  }, [salesHistory, storageKey]);

  // Generate transaction number
  const generateSaleNo = () => {
    const todayStr = saleDate.replace(/-/g, "");
    const count = salesHistory.filter(s => s.tgl === saleDate).length + 1;
    const serial = String(count).padStart(3, "0");
    return `PJ-${todayStr}-${serial}`;
  };

  // Re-generate sale volume invoice whenever date changes
  useEffect(() => {
    setSaleNo(generateSaleNo());
  }, [saleDate, salesHistory.length]);

  // Handle setting default payment COA account
  useEffect(() => {
    if (props.rekeningData.length > 0) {
      // Find cash account 1-1101 first
      const cashAcct = props.rekeningData.find(r => r.id === "bnk-1" || r.nama.toLowerCase().includes("tunai"));
      if (cashAcct) {
        setSelectedPayCoa("1-1101");
      } else {
        // Fallback to first available cash / bank account
        const firstCoa = "1-110" + props.rekeningData[0].id.replace("bnk-", "");
        setSelectedPayCoa(firstCoa);
      }
    } else {
      setSelectedPayCoa("1-1101");
    }
  }, [props.rekeningData]);

  // Reset cart and info
  const handleResetForm = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashAmount(0);
    setNoteMsg("");
    setPelangganTamu();
    setSaleNo(generateSaleNo());
    setErrorMsg("");
  };

  const setPelangganTamu = () => {
    setSelectedPelangganId("tamu");
    setCustomPelangganName("");
  };

  // Add Item to Shopping Cart
  const handleAddToCart = (product: StokItem) => {
    if (product.qty <= 0) {
      setErrorMsg(`Minyak / Produk ${product.nama} habis stok!`);
      return;
    }

    const existing = cart.find(item => item.stokId === product.id);
    if (existing) {
      if (existing.qty >= product.qty) {
        setErrorMsg(`Stok tidak mencukupi untuk menambah item ${product.nama}!`);
        return;
      }
      setCart(cart.map(item => 
        item.stokId === product.id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      const defaultModal = product.hargaModal || Math.round(product.hargaJual * 0.75);
      setCart([...cart, {
        stokId: product.id,
        kode: product.kode,
        nama: product.nama,
        hargaJual: product.hargaJual,
        hargaModal: defaultModal,
        qty: 1,
        maxStock: product.qty
      }]);
    }
    setErrorMsg("");
  };

  // Adjust cart items
  const handleUpdateCartQty = (stokId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.stokId === stokId) {
        const nextQty = item.qty + delta;
        if (nextQty <= 0) return null; // will be filtered
        if (nextQty > item.maxStock) {
          setErrorMsg(`Batas stok ${item.nama} tercapai (${item.maxStock})!`);
          return item;
        }
        return { ...item, qty: nextQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
    setErrorMsg("");
  };

  // Delete cart item
  const handleRemoveFromCart = (stokId: string) => {
    setCart(prev => prev.filter(item => item.stokId !== stokId));
    setErrorMsg("");
  };

  // Catalog item search
  const filteredProducts = props.stokData.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
  const cartTax = Math.round(cartSubtotal * 0.11); // PPN 11%
  const grandTotal = Math.max(0, cartSubtotal + cartTax - discountAmount);
  const changeAmount = Math.max(0, cashAmount - grandTotal);

  // Get recipient account details
  const getSelectedPaymentName = () => {
    // Map COA back to bank/cash name
    const coa = props.coaData.find(c => c.kode === selectedPayCoa);
    if (coa) return coa.nama;
    return selectedPayCoa === "1-1101" ? "Kas Tunai" : "Rekening Bank";
  };

  // Submit checkout transaction with atomic stock verification
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (props.accessMode === "view") {
      setErrorMsg("Akses Ditolak: Akun 'View Only' tidak diijinkan merekam transaksi penjualan.");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Gagal: Keranjang belanja kosong!");
      return;
    }

    if (!selectedPayCoa) {
      setErrorMsg("Gagal: Mohon pilih metode pembayaran penerima kas!");
      return;
    }

    // Safety check for cash payment integrity
    if (cashAmount > 0 && cashAmount < grandTotal) {
      setErrorMsg("Gagal: Uang tunai yang diterima kurang dari total tagihan!");
      return;
    }

    // Secondary verify stock quantities are still sufficient before committing
    for (const item of cart) {
      const realProduct = props.stokData.find(s => s.id === item.stokId);
      if (!realProduct || realProduct.qty < item.qty) {
        setErrorMsg(`Gagal: Stok ${item.nama} tidak mencukupi atau sudah didelete!`);
        return;
      }
    }

    // Determine customer name
    let clientNama = "Tamu Umum";
    if (selectedPelangganId === "custom" && customPelangganName.trim()) {
      clientNama = customPelangganName.trim();
    } else if (selectedPelangganId !== "tamu" && selectedPelangganId !== "custom") {
      const mbr = props.anggotaData.find(m => m.id === selectedPelangganId);
      if (mbr) clientNama = `${mbr.nama} (${mbr.id})`;
    }

    // Record Sale
    const saleItems = cart.map(c => ({
      stokId: c.stokId,
      qty: c.qty,
      hargaJual: c.hargaJual,
      hargaModal: c.hargaModal
    }));

    setIsSubmitting(true);
    try {
      await props.onRecordSale(
        saleDate,
        saleNo,
        clientNama,
        selectedPayCoa,
        saleItems
      );

      // Save into internal receipt history log
      const receiptObj: PastSale = {
        id: saleNo,
        tgl: saleDate,
        customerNama: clientNama,
        paymentCoa: selectedPayCoa,
        paymentName: getSelectedPaymentName(),
        subtotal: cartSubtotal,
        tax: cartTax,
        discount: discountAmount,
        total: grandTotal,
        cashReceived: cashAmount > 0 ? cashAmount : grandTotal,
        change: cashAmount > 0 ? changeAmount : 0,
        items: cart.map(c => ({
          nama: c.nama,
          qty: c.qty,
          hargaJual: c.hargaJual
        }))
      };

      setSalesHistory(prev => [receiptObj, ...prev]);

      // Open receipt invoice view
      setCurrentReceipt(receiptObj);
      setIsReceiptOpen(true);

      // Reset current POS
      handleResetForm();
    } catch (err: any) {
      console.error("Kesalahan checkout:", err);
      let errMsgText = err.message || "Kesalahan jaringan atau hak akses ditolak.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errMsgText = parsed.error;
        }
      } catch {
        // Fallback to raw message if not JSON
      }
      setErrorMsg("Gagal: " + errMsgText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiptLog = (sale: PastSale) => {
    setCurrentReceipt(sale);
    setIsReceiptOpen(true);
  };

  const handleDeleteHistorySale = (id: string) => {
    setShowConfirmDeleteSaleId(id);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "kasir") {
      csvContent += "Keranjang Belanja Aktif (Draft Kasir)\r\n";
      csvContent += "ID Barang,Kode Barang,Nama Barang,Harga Jual Satuan (Rp),Kuantitas Belanja,Total (Rp)\r\n";
      cart.forEach(item => {
        const row = [
          `"${item.stokId}"`,
          `"${item.kode}"`,
          `"${item.nama.replace(/"/g, '""')}"`,
          item.hargaJual.toString(),
          item.qty.toString(),
          (item.hargaJual * item.qty).toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "Riwayat Penjualan Kasir Hari Ini\r\n";
      csvContent += "ID Transaksi,Tanggal,Nama Pembeli,Metode Pembayaran,Subtotal (Rp),Diskon (Rp),Total Akhir (Rp),Barang,Kuantitas\r\n";
      salesHistory.forEach(sale => {
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
            item.qty.toString()
          ].join(",");
          csvContent += row + "\r\n";
        });
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KASIR_${activeTab.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="penjualan-pos-screen" className="space-y-6">
      {/* DELETE LOG CONFIRMATION MODAL */}
      {showConfirmDeleteSaleId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Riwayat Nota?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus log transaksi <span className="font-bold text-red-600">{showConfirmDeleteSaleId}</span> ini? 
                <br /><small className="text-slate-400">Tindakan ini hanya menghapus salinan nota digital di sesi ini, data ledger akuntansi tetap tersimpan di server.</small>
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteSaleId(null)}
                  className="flex-1 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesHistory(salesHistory.filter(s => s.id !== showConfirmDeleteSaleId));
                    setShowConfirmDeleteSaleId(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition active:scale-95 cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md border border-red-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 leading-tight">Mesin Penjualan &amp; POS Toko</h1>
            <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">Operasional Unit Bisnis • Terintegrasi Otomatis Jurnal &amp; Stok</p>
          </div>
        </div>

        {/* TABS & EXPORT SELECTOR */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="export-sales-csv-btn"
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Download active items as CSV spreadsheet"
          >
            <FileDown className="h-4 w-4" /> Export CSV (Excel)
          </button>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("kasir")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "kasir"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Transaksi Baru (Kasir)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("riwayat")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "riwayat"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Clock className="h-4 w-4" /> Riwayat Nota ({salesHistory.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "kasir" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: PRODUCT CATALOG (8 COLS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* CATALOG TOOLBAR & FILTER */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="catalog-search"
                  type="text"
                  placeholder="Cari nama atau kode barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 self-end md:self-auto font-mono">
                <span>Jumlah item terdata: {props.stokData.length}</span>
              </div>
            </div>

            {/* CATALOG GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="bg-white py-12 px-4 rounded-xl border border-slate-150 text-center col-span-full">
                  <p className="text-slate-400 font-medium text-xs">Tidak ada persediaan barang dagang yang cocok dengan kata kunci Anda.</p>
                </div>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.qty <= 0;
                  const isLowStock = product.qty > 0 && product.qty <= 10;
                  
                  return (
                    <div 
                      key={product.id}
                      className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between gap-3 shadow-sm hover:shadow transition-all relative overflow-hidden ${
                        isOutOfStock 
                          ? "border-slate-150 opacity-65" 
                          : "border-slate-200 hover:border-red-200"
                      }`}
                    >
                      {/* STOCK STATUS FLAGS */}
                      <div className="absolute top-2 right-2">
                        {isOutOfStock ? (
                          <span className="bg-red-100 text-red-750 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono">Habis</span>
                        ) : isLowStock ? (
                          <span className="bg-amber-100 text-amber-805 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono animate-pulse">Menipis</span>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">{product.kode}</span>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 pr-6 leading-relaxed" title={product.nama}>{product.nama}</h3>
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2.5">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 font-medium leading-none">Harga Jual</p>
                          <p className="text-sm font-black text-slate-900 mt-1">Rp {product.hargaJual.toLocaleString('id-ID')}</p>
                          <p className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">Sisa: <span className={isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-500" : "text-emerald-600"}>{product.qty} unit</span></p>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product)}
                          className={`p-2.5 rounded-lg shadow-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                            isOutOfStock 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                              : "bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95"
                          }`}
                          title={isOutOfStock ? "Kehabisan stok" : "Tambah ke keranjang"}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ERROR ALERTS BANNER */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-150 p-3.5 rounded-lg text-xs font-bold text-red-700 flex items-start gap-2 animate-bounce">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="leading-normal">{errorMsg}</span>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: BILLING PANEL / CART (4 COLS) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="h-4.5 w-4.5 text-red-600" /> Nota Belanja ({cart.length})
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-slate-400 hover:text-red-600 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Bersihkan
                </button>
              )}
            </div>

            {/* CART LIST ITEMS */}
            <div className="space-y-3 max-h-76 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <p className="font-semibold">Keranjang belanja kosong</p>
                  <p className="text-[10px] text-slate-400">Pilih item dari katalog di sebelah kiri untuk mulai transaksi.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.stokId} className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-start justify-between gap-3 relative group">
                    <div className="space-y-0.5 pr-4 text-left">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-bold">@ Rp {item.hargaJual.toLocaleString('id-ID')} × {item.qty}</p>
                      <p className="text-xs font-black text-slate-900 pt-1">Rp {(item.qty * item.hargaJual).toLocaleString('id-ID')}</p>
                    </div>

                    <div className="flex items-center gap-1 pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.stokId, -1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-black flex items-center justify-center cursor-pointer transition select-none"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-black text-slate-800">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.stokId, 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-black flex items-center justify-center cursor-pointer transition select-none"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.stokId)}
                        className="ml-1 text-slate-400 hover:text-red-600 p-1 cursor-pointer transition"
                        title="Hapus item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CHECKOUT CONFIGURATION FORM */}
            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-100">
              
              {/* DATE & INVOICE NUMBER */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Nota</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-red-500 bg-slate-50 font-medium cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No. Invoice</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={saleNo}
                    title="Nomor invoice terbuat otomatis"
                    className="w-full px-2.5 py-1.5 text-xs text-slate-500 border border-slate-200 rounded bg-slate-100 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* CUSTOMER PICKER */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pelanggan / Member Desa</label>
                <select
                  id="customer-select"
                  value={selectedPelangganId}
                  onChange={(e) => {
                    setSelectedPelangganId(e.target.value);
                    if (e.target.value !== "custom") {
                      setCustomPelangganName("");
                    }
                  }}
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-red-500 bg-white font-medium cursor-pointer"
                >
                  <option value="tamu">Tamu Umum (Cash / Langsung)</option>
                  <option value="custom">Tamu Tertentu (Tulis nama sendiri)</option>
                  <optgroup label="Daftar Pelanggan &amp; Mitra">
                    {props.anggotaData.filter(a => a.status === "Aktif").map(a => (
                      <option key={a.id} value={a.id}>{a.nama} ({a.id})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedPelangganId === "custom" && (
                <div className="flex flex-col gap-1 text-left animate-in slide-in-from-top-2 duration-150">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Lengkap Tamu</label>
                  <input
                    id="custom-customer-name"
                    type="text"
                    required
                    placeholder="Masukkan nama pembeli..."
                    value={customPelangganName}
                    onChange={(e) => setCustomPelangganName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-red-500 bg-white shadow-sm font-semibold"
                  />
                </div>
              )}

              {/* CASH PAYMENT INFLOW ACCOUNT */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-slate-1000 uppercase tracking-wider flex items-center gap-1.5 font-bold text-slate-700">
                  <CreditCard className="h-3.5 w-3.5 text-red-500" /> Penerimaan Kas (Debet)
                </label>
                <select
                  id="checkout-payment-account"
                  value={selectedPayCoa}
                  onChange={(e) => setSelectedPayCoa(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-red-200 focus:ring-1 focus:ring-red-500 focus:outline-none bg-red-50/20 text-slate-900 font-bold cursor-pointer rounded"
                >
                  {props.rekeningData.filter(r => (r.status || "Aktif") === "Aktif").map(r => {
                    const mappedCoa = "1-110" + r.id.replace("bnk-", "");
                    return (
                      <option key={r.id} value={mappedCoa}>
                        {mappedCoa} - {r.nama} [Saldo: Rp {r.saldo.toLocaleString('id-ID')}]
                      </option>
                    );
                  })}
                </select>
                <span className="text-[9px] text-slate-400 leading-normal block mt-0.5 font-medium">Uang hasil penjualan otomatis mendebet nominal akun KAS/BANK pilihan di atas.</span>
              </div>

              {/* PAYMENT DISCOUNT */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Potongan Harga / Diskon (Rp)</label>
                <input
                  id="pos-discount-qty"
                  type="number"
                  min={0}
                  max={cartSubtotal}
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-red-500 bg-white font-mono font-bold"
                />
              </div>

              {/* FINANCIAL SUMMARY TABLE */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-150 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal Belanja:</span>
                  <span className="font-mono font-semibold">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>PPN (11%):</span>
                  <span className="font-mono font-semibold">Rp {cartTax.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-red-600 font-medium">
                    <span>Diskon Potongan:</span>
                    <span className="font-mono font-semibold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                  <span>Total Bayar:</span>
                  <span className="text-red-600 font-mono text-base">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* CASH RECEIVED & CHANGE (KEMBALIAN) */}
              <div className="grid grid-cols-2 gap-3 bg-red-50/15 p-3 rounded-lg border border-red-500/10">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Uang Tunai (Rp)</label>
                  <input
                    id="pos-cash-input"
                    type="number"
                    min={0}
                    value={cashAmount || ""}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    placeholder="Masukkan bayaran"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-red-500 bg-white font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <p className="text-[10px] font-bold text-slate-700 uppercase">Kembalian (Rp)</p>
                  <p className="py-1 text-sm font-mono font-black text-emerald-600">
                    Rp {cashAmount > grandTotal ? changeAmount.toLocaleString('id-ID') : "0"}
                  </p>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              {typeof navigator !== 'undefined' && !navigator.onLine && (
                <div className="p-2.5 border border-amber-200/50 bg-amber-50 rounded-xl text-[10px] text-amber-800 font-extrabold text-center leading-normal shadow-sm animate-pulse flex items-center justify-center gap-1.5">
                  <span>⚠️ Mode Offline: Transaksi diproses instan ke cache lokal &amp; disinkronkan otomatis saat internet aktif!</span>
                </div>
              )}
              <button
                id="pos-submit-btn"
                type="submit"
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  cart.length === 0 || isSubmitting
                    ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> {typeof navigator !== 'undefined' && navigator.onLine ? "Memproses Transaksi Cloud..." : "Menyimpan Transaksi Lokal..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4.5 w-4.5" /> Proses &amp; Cetak {typeof navigator !== 'undefined' && navigator.onLine ? "Faktur Nota" : "Faktur Nota (Lokal)"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* TAB 2: SALES LOGS HISTORY VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="p-4 bg-slate-50 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono">Riwayat Log Penjualan POS Sesi Ini</h2>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold font-mono px-2 py-0.5 rounded-full">Total Slip: {salesHistory.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-150 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 text-left">Nomor Nota</th>
                  <th className="py-3 px-4 text-left">Tanggal</th>
                  <th className="py-3 px-4 text-left">Pelanggan</th>
                  <th className="py-3 px-4 text-left">Penerimaan Kas</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Potongan/Diskon</th>
                  <th className="py-3 px-4 text-right">Total Akhir</th>
                  <th className="py-3 px-4 text-center">Buku Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-semibold">
                      Belum ada log transaksi penjualan yang terekam pada sesi berjalan.
                    </td>
                  </tr>
                ) : (
                  salesHistory.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{sale.id}</td>
                      <td className="py-3 px-4 font-mono">{sale.tgl}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{sale.customerNama}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-bold">{sale.paymentCoa}</span> {sale.paymentName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">Rp {sale.subtotal.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-650">
                        {sale.discount > 0 ? `-Rp ${sale.discount.toLocaleString('id-ID')}` : "Rp 0"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">Rp {sale.total.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptLog(sale)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" /> Nota Slip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistorySale(sale.id)}
                            className="text-slate-350 hover:text-red-650 p-1 cursor-pointer transition-all"
                            title="Hapus riwayat"
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
      )}

      {/* DETAILED INTERACTIVE RECEIPT modal popup */}
      {isReceiptOpen && currentReceipt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col justify-between max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* PRINTER PAPER HEAD */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 space-y-4">
              
              {/* HEADER COOP TITLE */}
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-sm uppercase text-slate-900">{props.koperasiName || "FINANCIAL SYSTEM"}</h3>
                <p className="text-[10px] text-slate-500 font-sans">Sistem Penjualan & POS Retail</p>
                <p className="text-[10px] text-slate-400 font-sans">Business Software Solutions</p>
                <p className="text-[9px] text-slate-400 pt-0.5">Telp: 0812-XXXX-XXXX • Tanggal: {currentReceipt.tgl}</p>
              </div>

              {/* TRANSACTION INFO */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>No. Slip:</span>
                  <span className="font-bold text-slate-900">{currentReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>Petugas Pembukuan (Aktif)</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold text-slate-900">{currentReceipt.customerNama}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aliran Kas:</span>
                  <span>{currentReceipt.paymentCoa} - {currentReceipt.paymentName}</span>
                </div>
              </div>

              {/* ITEMS ROW WITH SEPARATOR */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase pb-1 tracking-wider">Item Transaksi</p>
                
                {currentReceipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 text-left">
                    <div className="flex justify-between">
                      <span className="font-bold">{item.nama}</span>
                      <span className="font-bold font-mono">Rp {(item.qty * item.hargaJual).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{item.qty} Qty × Rp {item.hargaJual.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALS SEPARATOR */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal Belanja:</span>
                  <span className="font-mono">Rp {currentReceipt.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>PPN (11%):</span>
                  <span className="font-mono">Rp {currentReceipt.tax.toLocaleString('id-ID')}</span>
                </div>
                {currentReceipt.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Potongan:</span>
                    <span className="font-mono">-Rp {currentReceipt.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono">Rp {currentReceipt.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* CASH INPUT & CHANGE IF SHOWN */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>Dibayarkan Tunai:</span>
                  <span className="font-mono">Rp {currentReceipt.cashReceived.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Kembalian:</span>
                  <span className="font-mono text-emerald-600">Rp {currentReceipt.change.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="border-t border-dashed border-slate-300 pt-4 text-center space-y-1">
                <p className="text-[10px] font-sans font-bold text-slate-600">Terima Kasih Atas Kepercayaan Anda!</p>
                <p className="text-[9px] text-slate-400 font-sans leading-relaxed">Sistem Informasi Akuntansi & Operasional Komprehensif. Solusi Digital untuk Efisiensi Bisnis.</p>
                <p className="text-[8px] text-slate-350 font-mono select-none pt-2">--- TRANSACTION RECORDED IN LEDGER ---</p>
              </div>
            </div>

            {/* ACTION BUTTON CONTAINER */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-705 border border-slate-250 font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak (PDF)
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
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
