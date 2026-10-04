import React, { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { CartDrawer, CartItem } from "./components/CartDrawer";
import { ReceiptModal } from "./components/ReceiptModal";
import { DashboardView } from "./components/DashboardView";
import { Search, Sparkles } from "lucide-react";
import { main } from "../wailsjs/go/models";
import {
  GetProducts,
  CreateOrder,
  GetSyncStatus,
  TriggerSync,
  GetReceiptText,
} from "../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";

export function App() {
  const [activeTab, setActiveTab] = useState<"pos" | "dashboard">("pos");
  const [products, setProducts] = useState<main.Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<main.SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [receiptText, setReceiptText] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  // Initialize data
  useEffect(() => {
    loadProducts();
    loadSyncStatus();

    // Listen to background sync updates from Go
    EventsOn("sync:status", (status: any) => {
      setSyncStatus(main.SyncStatus.createFrom(status));
    });

    return () => {
      EventsOff("sync:status");
    };
  }, []);

  const loadProducts = async () => {
    try {
      const data = await GetProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products from SQLite:", err);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await GetSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error("Failed to load sync status:", err);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const resultMsg = await TriggerSync();
      await loadSyncStatus();
      alert(resultMsg);
    } catch (err) {
      alert("Error sync: " + err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cart operations
  const handleAddToCart = (product: main.Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout transaction
  const handleCheckout = async (orderData: {
    customerName: string;
    paymentMethod: string;
    cashGiven: number;
    changeDue: number;
    totalAmount: number;
  }) => {
    setIsProcessingCheckout(true);
    try {
      const orderItems = cart.map(
        (c) =>
          new main.OrderItem({
            productId: c.product.id,
            name: c.product.name,
            price: c.product.price,
            quantity: c.quantity,
            subtotal: c.product.price * c.quantity,
          })
      );

      const orderPayload = new main.Order({
        outletId: "senopati-01",
        customerName: orderData.customerName,
        items: orderItems,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        cashGiven: orderData.cashGiven,
        changeDue: orderData.changeDue,
        status: "COMPLETED",
      });

      // 1. Save to SQLite via Go Wails method
      const created = await CreateOrder(orderPayload);

      // 2. Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });

      // 3. Clear cart
      setCart([]);

      // 4. Fetch realistic thermal receipt string
      const receipt = await GetReceiptText(created.id);
      setReceiptText(receipt);

      // 5. Refresh status
      await loadSyncStatus();
    } catch (err) {
      alert("Gagal memproses transaksi: " + err);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Filter products by category & search
  const categories = useMemo(() => {
    const set = new Set<string>(["Semua"]);
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "Semua" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        onSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "pos" ? (
          <>
            {/* Catalog Grid Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-5">
              {/* Category Pills & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Categories */}
                <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari menu kopi, pastry..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <p className="font-semibold text-sm">Tidak ada menu yang sesuai</p>
                    <p className="text-xs mt-1">Coba cari dengan kata kunci lain</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Cart Drawer */}
            <CartDrawer
              items={cart}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              isProcessing={isProcessingCheckout}
            />
          </>
        ) : (
          /* Dashboard & Laporan Tab */
          <DashboardView
            onOpenReceipt={(text) => setReceiptText(text)}
            syncStatus={syncStatus}
            onSync={handleManualSync}
            isSyncing={isSyncing}
          />
        )}
      </div>

      {/* Thermal Receipt Preview Modal */}
      {receiptText && (
        <ReceiptModal
          receiptText={receiptText}
          onClose={() => setReceiptText(null)}
        />
      )}
    </div>
  );
}

export default App;
