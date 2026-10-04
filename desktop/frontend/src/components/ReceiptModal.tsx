import React from "react";
import { Printer, X, CheckCircle } from "lucide-react";

interface ReceiptModalProps {
  receiptText: string;
  onClose: () => void;
  onPrintAgain?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptText,
  onClose,
  onPrintAgain,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800 text-sm">
              Transaksi Berhasil &amp; Struk Tercetak
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white p-5 rounded-sm shadow-md border-t-4 border-t-amber-500 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre select-text w-full max-w-[280px]">
            {receiptText}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
          <button
            onClick={() => {
              if (onPrintAgain) onPrintAgain();
              window.print();
            }}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ulang</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          >
            <span>Selesai (Order Baru)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
