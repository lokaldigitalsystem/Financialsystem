/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Printer, RefreshCw, Send, CheckCircle, FileDown, Sparkles, Plus, Trash2, History, X, Search, ShoppingBag } from 'lucide-react';
import { PastSale } from '../types';
// @ts-ignore
import logoKoperasi from '../assets/images/regenerated_image_1780331184031.jpg';

interface InvoiceProps {
  koperasiName?: string;
  koperasiAlamat?: string;
  koperasiLogo?: string;
  koperasiInvoiceSize?: string;
  koperasiId?: string;
  salesHistory: PastSale[];
  onUpdateSalesHistory: React.Dispatch<React.SetStateAction<PastSale[]>>;
}

export function Invoice({
  koperasiName = "Supercloud Integrated Financial System",
  koperasiAlamat = "Sistem Informasi Akuntansi & Operasional Komprehensif",
  koperasiLogo = "",
  koperasiInvoiceSize = "A4",
  koperasiId = "",
  salesHistory,
  onUpdateSalesHistory
}: InvoiceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'resmi' | 'penawaran'>('resmi');

  const [invNo, setInvNo] = useState("");
  const [invClient, setInvClient] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [items, setItems] = useState<Array<{ id: string; nama: string; qty: number; harga: number }>>([]);
  
  // Sales History states
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = salesHistory.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.customerNama && s.customerNama.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const importFromSale = (sale: any) => {
    setInvNo(sale.id);
    setInvClient(sale.customerNama || "Umum / Customer");
    setDiscount(sale.discount || 0);
    setTax(sale.tax || 0);
    
    const mappedItems = sale.items.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      nama: item.nama,
      qty: item.qty,
      harga: item.hargaJual
    }));
    
    setItems(mappedItems);
    setShowSalesModal(false);
  };
  // Customizable signature fields
  const [leftSignLabel, setLeftSignLabel] = useState("");
  const [rightSignLabel, setRightSignLabel] = useState("");
  const [leftSignName, setLeftSignName] = useState("");
  const [rightSignName, setRightSignName] = useState("Accounting Officer");

  // Preview copies of states - now they will automatically sync or be replaced by direct props
  const [pNo, setPNo] = useState("");
  const [pClient, setPClient] = useState("");
  const [pDiscount, setPDiscount] = useState(0);
  const [pTax, setPTax] = useState(0);
  const [previewItems, setPreviewItems] = useState<Array<{ id: string; nama: string; qty: number; harga: number }>>([]);

  // Sync preview in real-time
  React.useEffect(() => {
    setPNo(invNo || (activeSubTab === 'resmi' ? "INV/SYSTEM/2026/XXXX" : "QTE/SYSTEM/2026/XXXX"));
    setPClient(invClient || "Umum / Customer");
    setPDiscount(discount);
    setPTax(tax);
    setPreviewItems([...items]);
  }, [invNo, invClient, items, activeSubTab, discount, tax]);

  const handleTabChange = (tab: 'resmi' | 'penawaran') => {
    setActiveSubTab(tab);
    setInvNo("");
    setInvClient("");
    setDiscount(0);
    setTax(0);
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), nama: "", qty: 1, harga: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (index: number, key: 'nama' | 'qty' | 'harga', value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    setItems(updated);
  };


  const triggerPrint = () => {
    // Print directly using browser window API
    window.print();
  };

  const subtotal = previewItems.reduce((acc, curr) => acc + (curr.qty * curr.harga), 0);
  const totalAmount = subtotal - pDiscount + pTax;

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeSubTab === 'resmi') {
      csvContent += "FAKTUR DAN INVOICE NOTA PENAGIHAN KOPERASI\r\n";
      csvContent += `Nomor Invoice,${pNo}\r\n`;
      csvContent += `Penerima Tagihan,"${pClient.replace(/"/g, '""')}"\r\n`;
      csvContent += `Tanggal Cetak,${new Date().toLocaleDateString('id-ID')}\r\n`;
      csvContent += "\r\nUraian Barang/Iuran,Qty,Harga Satuan (Rp),Total (Rp)\r\n";
      
      previewItems.forEach(item => {
        const row = [
          `"${item.nama.replace(/"/g, '""')}"`,
          item.qty.toString(),
          item.harga.toString(),
          (item.qty * item.harga).toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
      csvContent += `\r\nSUBTOTAL,,Rp,${subtotal}\r\n`;
      csvContent += `POTONGAN (DISCOUNT),,Rp,${pDiscount}\r\n`;
      csvContent += `PAJAK (VAT/TAX),,Rp,${pTax}\r\n`;
      csvContent += `TOTAL PENAGIHAN,,Rp,${totalAmount}\r\n`;
    } else {
      csvContent += "SURAT PENAWARAN HARGA (QUOTATION) KOPERASI\r\n";
      csvContent += `Nomor Penawaran,${pNo}\r\n`;
      csvContent += `Nama Calon Pembeli,"${pClient.replace(/"/g, '""')}"\r\n`;
      csvContent += `Tanggal Penawaran,${new Date().toLocaleDateString('id-ID')}\r\n`;
      csvContent += "\r\nUraian Spesifikasi Barang/Sewa,Qty,Estimasi Harga Satuan (Rp),Total (Rp)\r\n";
      
      previewItems.forEach(item => {
        const row = [
          `"${item.nama.replace(/"/g, '""')}"`,
          item.qty.toString(),
          item.harga.toString(),
          (item.qty * item.harga).toString()
        ].join(",");
        csvContent += row + "\r\n";
      });
      csvContent += `\r\nSUBTOTAL,,Rp,${subtotal}\r\n`;
      csvContent += `POTONGAN (DISCOUNT),,Rp,${pDiscount}\r\n`;
      csvContent += `PAJAK (VAT/TAX),,Rp,${pTax}\r\n`;
      csvContent += `TOTAL ESTIMASI PENAWARAN,,Rp,${totalAmount}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = activeSubTab === 'resmi' ? `INVOICE_${pNo.replace(/\//g, "-")}.csv` : `PENAWARAN_${pNo.replace(/\//g, "-")}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 border-red-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-red-600" /> Cetak Nota &amp; Lembaran Faktur
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cetak lembar invoice tagihan resmi ataupun surat estimasi penawaran harga (Quotation)
          </p>
        </div>
        <button
          id="export-invoice-csv-btn"
          onClick={exportToCSV}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          title="Download preview invoice/quotation details as a CSV ledger sheet"
        >
          <FileDown className="h-4 w-4" /> Export CSV (Excel)
        </button>
      </div>

      {/* SUBMENU TABS FOR RESMI VS PENAWARAN */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 max-w-lg mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('resmi')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'resmi'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" /> Faktur/Tagihan Resmi
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('penawaran')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'penawaran'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Invoice Penawaran (Quotation)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT FORM CARD */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm self-start space-y-5">
          <div className="border-b pb-2 mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-gray-800">
                {activeSubTab === 'resmi' ? 'Formulir Isian Faktur Nota Penagihan' : 'Formulir Isian Surat Penawaran Harga (Quotation)'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {activeSubTab === 'resmi' ? 'Silahkan Isi Rincian Tagihan' : 'Silahkan Isi Rincian Penawaran'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSalesModal(true)}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer active:scale-95"
            >
              <History className="h-3 w-3" /> Tarik Data POS
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">
              {activeSubTab === 'resmi' ? 'Nomor Voucher Invoice' : 'Nomor Voucher Penawaran'}
            </label>
            <input
              id="inv-no-input"
              type="text"
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-mono font-bold"
              value={invNo}
              onChange={(e) => setInvNo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">
              {activeSubTab === 'resmi' ? 'Kirim Penagihan Kepada Klien' : 'Kirim Penawaran Kepada Calon Pembeli'}
            </label>
            <input
              id="inv-client-input"
              type="text"
              placeholder={activeSubTab === 'resmi' ? 'Masukan Nama Klien' : 'Contoh: Kelompok Tani Harapan Jaya'}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-semibold"
              value={invClient}
              onChange={(e) => setInvClient(e.target.value)}
            />
          </div>

          {/* DYNAMIC ROWS / ITEMS LIST */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <label className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                Rincian Item Jasa / Barang
              </label>
              <button
                type="button"
                id="add-invoice-row-btn"
                onClick={addItem}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer active:scale-95"
              >
                <Plus className="h-3 w-3" /> Tambah Baris
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-150 relative space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-gray-400">Baris #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12">
                      <input
                        type="text"
                        placeholder="Deskripsi barang atau nama iuran..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-red-500 font-semibold"
                        value={item.nama}
                        onChange={(e) => updateItem(index, 'nama', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-red-500 font-bold text-center font-mono"
                        value={item.qty || ""}
                        onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-8">
                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Harga Ssn (Rp)</label>
                      <input
                        type="number"
                        placeholder="Harga Satuan"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-red-500 font-bold text-right font-mono"
                        value={item.harga || ""}
                        onChange={(e) => updateItem(index, 'harga', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500">
                Pajak / PPN (Rp)
              </label>
              <input
                id="inv-tax-input"
                type="number"
                placeholder="0"
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-mono font-bold"
                value={tax || ""}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500">
                Diskon / Potongan (Rp)
              </label>
              <input
                id="inv-discount-input"
                type="number"
                placeholder="0"
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500 font-mono font-bold text-rose-600"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
            <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Pengaturan Tanda Tangan</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">Label Kiri (Jabatan)</label>
                <input
                  type="text"
                  placeholder={activeSubTab === 'resmi' ? 'Anggota Penerima,' : 'Calon Pembeli,'}
                  className="px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={leftSignLabel}
                  onChange={(e) => setLeftSignLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">Nama Kiri (Penandatangan)</label>
                <input
                  type="text"
                  placeholder="Opsional (Default: Nama Klien)"
                  className="px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={leftSignName}
                  onChange={(e) => setLeftSignName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">Label Kanan (Jabatan)</label>
                <input
                  type="text"
                  placeholder={activeSubTab === 'resmi' ? 'Kasir Keuangan,' : 'Pembuat STAF,'}
                  className="px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={rightSignLabel}
                  onChange={(e) => setRightSignLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">Nama Kanan (Petugas)</label>
                <input
                  type="text"
                  className="px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-red-500"
                  value={rightSignName}
                  onChange={(e) => setRightSignName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PRINT PREVIEW CONTAINER */}
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 flex flex-col items-center select-none">
          {(() => {
            let containerWidthClass = "max-w-[420px] p-6 text-xs";
            let kopLogoSizeClass = "w-12 h-12";
            let kopTitleClass = "text-xs";
            let kopSubTitleClass = "text-[9px]";
            let tableHeaderClass = "text-[9px]";
            let tableBodyClass = "text-[10px]";
            let tableMarginClass = "mt-4 space-y-2";
            
            if (koperasiInvoiceSize === '80mm') {
              containerWidthClass = "w-[305px] p-3 text-[10px]";
              kopLogoSizeClass = "w-9 h-9";
              kopTitleClass = "text-[10px]";
              kopSubTitleClass = "text-[8px]";
              tableHeaderClass = "text-[8px]";
              tableBodyClass = "text-[8.5px]";
              tableMarginClass = "mt-2 space-y-1.5";
            } else if (koperasiInvoiceSize === '58mm') {
              containerWidthClass = "w-[220px] p-2 text-[8.5px]";
              kopLogoSizeClass = "w-7 h-7";
              kopTitleClass = "text-[8.5px]";
              kopSubTitleClass = "text-[7.5px] leading-tight";
              tableHeaderClass = "text-[7.5px]";
              tableBodyClass = "text-[7.5px]";
              tableMarginClass = "mt-2 space-y-1";
            }

            return (
              <div id="printable-area" className={`bg-white w-full rounded shadow-md border border-gray-100 text-left relative flex flex-col justify-between text-gray-800 ${containerWidthClass}`}>
                <div>
                  {/* INVOICE HEADER KOP */}
                  <div className="border-b-2 border-red-600 pb-3 flex items-center gap-2.5">
                    <img 
                      src={koperasiLogo || logoKoperasi} 
                      alt="Logo"
                      className={`${kopLogoSizeClass} rounded object-cover shrink-0`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/90x90?text=KOP';
                      }}
                    />
                    <div className="min-w-0">
                      <h1 className={`font-black tracking-tight text-red-600 uppercase ${kopTitleClass}`}>{koperasiName}</h1>
                      <p className={`font-medium text-gray-400 mt-0.5 leading-tight ${kopSubTitleClass}`}>{koperasiAlamat}</p>
                    </div>
                  </div>

                  {/* INVOICE INFO */}
                  <div className={`${tableMarginClass}`}>
                    <div className="text-center py-1 mb-1.5 bg-gray-50 rounded border border-gray-100">
                      <span className="text-[9px] font-black text-blue-950 uppercase tracking-wider leading-none">
                        {activeSubTab === 'resmi' ? 'FAKTUR & INVOICE TAGIHAN RESMI' : 'SURAT ESTIMASI PENAWARAN (QUOTATION)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                        {activeSubTab === 'resmi' ? 'No. Nota Faktur' : 'No. Penawaran'}
                      </span>
                      <span className="font-mono font-bold text-gray-900">{pNo}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                        {activeSubTab === 'resmi' ? 'Penerima Tagihan' : 'Calon Pembeli'}
                      </span>
                      <span className="font-bold text-gray-900">{pClient}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                        {activeSubTab === 'resmi' ? 'Tanggal Nota' : 'Tanggal Penawaran'}
                      </span>
                      <span className="font-medium text-gray-500">20 Mei 2026 (Periode Berjalan)</span>
                    </div>

                    <div className="h-px bg-gray-100 my-1.5" />

                    {/* ITEMIZED TABLE FOR PREVIEW */}
                    <div className="space-y-1">
                      <span className="text-gray-400 font-bold uppercase text-[8px] tracking-wider block mb-0.5">
                        {activeSubTab === 'resmi' ? 'Rincian Barang / Jasa Yang Ditagihkan' : 'Rincian Estimasi Harga & Spesifikasi'}
                      </span>
                      <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 ${tableHeaderClass}`}>
                              <th className="py-1 px-1.5">Uraian</th>
                              <th className="py-1 px-1 text-center w-8">Qty</th>
                              <th className="py-1 px-1 text-right w-16">Harga</th>
                              <th className="py-1 px-1 text-right w-20">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y divide-gray-100 text-gray-700 ${tableBodyClass}`}>
                            {previewItems.map((item, idx) => (
                              <tr key={item.id || idx}>
                                <td className="py-1 px-1.5 font-medium leading-tight break-words">{item.nama || "-"}</td>
                                <td className="py-1 px-1 text-center font-mono font-bold text-gray-400">{item.qty}</td>
                                <td className="py-1 px-1 text-right font-mono text-gray-400">Rp{item.harga.toLocaleString('id-ID')}</td>
                                <td className="py-1 px-1 text-right font-mono font-bold text-gray-900">Rp{(item.qty * item.harga).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 my-1.5" />

                    {/* CALCULATION SUMMARY ROWS */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold uppercase text-[8px] tracking-wider">Subtotal</span>
                        <span className="font-mono font-bold text-gray-600">Rp{subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {pDiscount > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-rose-400 font-bold uppercase text-[8px] tracking-wider">Diskon (-)</span>
                          <span className="font-mono font-bold text-rose-500">-Rp{pDiscount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {pTax > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-emerald-400 font-bold uppercase text-[8px] tracking-wider">Pajak (+)</span>
                          <span className="font-mono font-bold text-emerald-500">+Rp{pTax.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gray-100 my-1.5" />

                    {/* TOTAL ROW */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-black text-gray-900 uppercase">
                        {activeSubTab === 'resmi' ? 'Total Sebesar:' : 'Total Estimasi:'}
                      </span>
                      <span className="text-lg font-black text-red-600 font-mono">
                        Rp{totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="pt-4 grid grid-cols-2 text-center text-[9px] text-gray-500 font-semibold gap-4">
                      <div>
                        <p>{leftSignLabel || (activeSubTab === 'resmi' ? 'Anggota Penerima,' : 'Calon Pembeli,')}</p>
                        <div className="h-8" />
                        <p className="border-t border-gray-200 pt-0.5 font-bold text-gray-700 truncate">{leftSignName || pClient}</p>
                      </div>
                      <div>
                        <p>{rightSignLabel || (activeSubTab === 'resmi' ? 'Kasir Keuangan,' : 'Pembuat STAF,')}</p>
                        <div className="h-8" />
                        <p className="border-t border-gray-200 pt-0.5 font-bold text-gray-700 font-mono">{rightSignName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            id="print-invoice-btn"
            onClick={triggerPrint}
            className="mt-5 w-full max-w-[420px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
          >
            <Printer className="h-4 w-4" /> Cetak Lembar Nota Transaksi (Print)
          </button>
        </div>
      </div>
      {/* SALES HISTORY MODAL */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-400" />
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">Riwayat Penjualan POS</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Pilih transaksi untuk ditarik ke dalam Invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSalesModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-gray-200">
               <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Cari No Nota atau Nama Pelanggan..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredHistory.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">Data tidak ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredHistory.map((sale) => (
                    <button
                      key={sale.id}
                      onClick={() => importFromSale(sale)}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{sale.id}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{sale.tgl} • {sale.customerNama || "Umum"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">Rp {sale.total.toLocaleString('id-ID')}</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{sale.items.length} Item</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
