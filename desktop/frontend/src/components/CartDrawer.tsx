import React, { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Banknote,
  QrCode,
  CreditCard,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { main } from "../../wailsjs/go/models";
import { formatRupiah } from "../utils";

export interface CartItem {
  product: main.Product;
  quantity: number;
}

interface CartDrawerProps {
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (orderData: {
    customerName: string;
    paymentMethod: string;
    cashGiven: number;
    changeDue: number;
    totalAmount: number;
  }) => void;
  isProcessing: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isProcessing,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "DEBIT">("CASH");
  const [cashGiven, setCashGiven] = useState<number>(0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;
  const changeDue = Math.max(0, cashGiven - grandTotal);

  const handleQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (paymentMethod === "CASH" && cashGiven < grandTotal) {
      alert("Jumlah uang tunai yang diberikan kurang dari total belanja!");
      return;
    }

    onCheckout({
      customerName: customerName.trim() || "Pelanggan Umum",
      paymentMethod,
      cashGiven: paymentMethod === "CASH" ? cashGiven : grandTotal,
      changeDue: paymentMethod === "CASH" ? changeDue : 0,
      totalAmount: grandTotal,
    });
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          <h2 className="font-bold text-slate-800 text-sm">Pesanan Aktif</h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {items.reduce((acc, i) => acc + i.quantity, 0)} item
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Customer Name */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Nama Pelanggan (Opsional)
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Misal: Budi / Meja 04"
          className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="font-semibold text-sm text-slate-600">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Klik produk di katalog untuk menambahkan pesanan kasir
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between bg-slate-50/70 p-2.5 rounded-xl border border-slate-100"
            >
              <div className="flex-1 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg">{item.product.image}</span>
                  <span className="font-semibold text-xs text-slate-800 line-clamp-1">
                    {item.product.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatRupiah(item.product.price)}
                </div>
              </div>

              {/* Quantity actions */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onUpdateQty(item.product.id, -1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-xs text-slate-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQty(item.product.id, 1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1 cursor-pointer"
                  title="Hapus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment & Checkout Section */}
      {items.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {/* Totals */}
          <div className="space-y-1.5 text-xs text-slate-600 pb-2 border-b border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>PB1 (Pajak Resto 10%)</span>
              <span className="font-medium text-slate-800">{formatRupiah(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
              <span>Total Tagihan</span>
              <span className="text-amber-600">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-amber-500/10 border-amber-500 text-amber-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-4 h-4 mb-1" />
                <span>Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  paymentMethod === "QRIS"
                    ? "bg-amber-500/10 border-amber-500 text-amber-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <QrCode className="w-4 h-4 mb-1" />
                <span>QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("DEBIT")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  paymentMethod === "DEBIT"
                    ? "bg-amber-500/10 border-amber-500 text-amber-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span>Kartu/EDC</span>
              </button>
            </div>
          </div>

          {/* Cash input & quick presets */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(grandTotal)}
                  className="flex-1 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(50000)}
                  className="flex-1 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  50k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(100000)}
                  className="flex-1 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  100k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(200000)}
                  className="flex-1 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  200k
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Tunai Diterima:</span>
                <input
                  type="number"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  placeholder="Rp 0"
                  className="w-32 text-right font-bold text-xs px-2 py-1 bg-white rounded-md border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {cashGiven >= grandTotal && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 p-2 rounded-lg font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(changeDue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isProcessing ? "Memproses Transaksi..." : "Bayar & Cetak Struk"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
