import React from "react";
import {
  Coffee,
  Wifi,
  WifiOff,
  RefreshCw,
  LayoutDashboard,
  ShoppingBag,
  Store,
} from "lucide-react";
import { main } from "../../wailsjs/go/models";

interface HeaderProps {
  activeTab: "pos" | "dashboard";
  setActiveTab: (tab: "pos" | "dashboard") => void;
  syncStatus: main.SyncStatus | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  onSync,
  isSyncing,
}) => {
  const isOnline = syncStatus?.isOnline ?? false;
  const pendingCount = syncStatus?.pendingCount ?? 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs select-none">
      {/* Brand & Outlet info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
          <Coffee className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-slate-800 text-base tracking-tight">
              Artisan Cafe &amp; Bakery
            </h1>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              Desktop POS
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Cabang Senopati (POS-01)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pos"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Kasir (POS)</span>
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard &amp; Laporan</span>
        </button>
      </div>

      {/* Cloud Sync Status Pill & Trigger */}
      <div className="flex items-center space-x-3">
        {/* Status Indicator */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloud Online</span>
            </>
          ) : (
            <>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline (SQLite)</span>
            </>
          )}

          {pendingCount > 0 && (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          title="Sinkronisasi manual ke server cloud Bun/Hono"
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};
