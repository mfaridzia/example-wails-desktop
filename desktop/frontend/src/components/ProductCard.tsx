import React from "react";
import { Plus } from "lucide-react";
import { main } from "../../wailsjs/go/models";
import { formatRupiah } from "../utils";

interface ProductCardProps {
  product: main.Product;
  onAddToCart: (product: main.Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
}) => {
  return (
    <div
      onClick={() => onAddToCart(product)}
      className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none"
    >
      <div>
        <div className="w-full h-24 bg-slate-50 rounded-xl flex items-center justify-center text-4xl mb-3 group-hover:scale-105 transition-transform duration-200">
          {product.image || "☕"}
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            {product.category}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Stok: {product.stock}
          </span>
        </div>
        <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-extrabold text-slate-900 text-sm">
          {formatRupiah(product.price)}
        </span>
        <button
          className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors"
          title="Tambah ke Keranjang"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
