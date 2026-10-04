import React, { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  CloudCheck,
  TrendingUp,
  Receipt,
  Server,
  Database,
  ArrowUpRight,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { main } from "../../wailsjs/go/models";
import { GetOrders, GetMetrics, GetReceiptText } from "../../wailsjs/go/main/App";
import { formatRupiah, formatDate } from "../utils";

interface DashboardViewProps {
  onOpenReceipt: (text: string) => void;
  syncStatus: main.SyncStatus | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenReceipt,
  syncStatus,
  onSync,
  isSyncing,
}) => {
  const [orders, setOrders] = useState<main.Order[]>([]);
  const [metrics, setMetrics] = useState<main.DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedMetrics] = await Promise.all([
        GetOrders(50),
        GetMetrics(),
      ]);
      setOrders(fetchedOrders || []);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [syncStatus]);

  const handleViewReceipt = async (orderId: string) => {
    try {
      const text = await GetReceiptText(orderId);
      onOpenReceipt(text);
    } catch (err) {
      alert("Gagal memuat struk: " + err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner: Architecture Showcase */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-5 shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Offline-First Architecture
            </span>
            <span className="text-xs text-slate-400">
              Wails (Go) + Local SQLite + Bun Cloud Sync
            </span>
          </div>
          <h2 className="text-lg font-bold">
            Status Sinkronisasi &amp; Database Lokal
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Transaksi otomatis disimpan di <strong>SQLite lokal</strong> terlebih dahulu untuk memastikan kasir tidak pernah macet saat offline. Worker Go di background akan menyinkronkannya ke cloud server secara otomatis.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Database Lokal</div>
              <div className="font-bold text-white">SQLite (Zero CGO)</div>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Cloud Endpoint</div>
              <div className="font-bold text-white">Bun / Hono API</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Omzet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Omzet Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatRupiah(metrics?.totalRevenue || 0)}
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Semua transaksi kasir</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics?.totalOrders || 0}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            Pesanan selesai diproses
          </div>
        </div>

        {/* Card 3: Pending Sync */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tertunda Sync (Offline)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {syncStatus?.pendingCount ?? 0}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {(syncStatus?.pendingCount ?? 0) === 0
              ? "Semua data sinkron ke cloud"
              : "Menunggu koneksi cloud"}
          </div>
        </div>

        {/* Card 4: Top Product */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Item Terlaris
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-slate-900 truncate">
            {metrics?.topProduct || "Iced Americano"}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            Paling diminati pelanggan
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Riwayat Transaksi Lokal &amp; Cloud</h3>
            <p className="text-xs text-slate-500">
              Daftar transaksi yang tersimpan di SQLite lokal dan status pengiriman ke cloud
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status Sync</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi di kasir ini.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {o.customerName || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {o.items?.map((it) => `${it.quantity}x ${it.name}`).join(", ") || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatRupiah(o.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {o.isSynced ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Cloud Synced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>SQLite Only</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(o.id)}
                        className="inline-flex items-center space-x-1 text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                        title="Lihat Struk Thermal"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
