import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  outletId: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  cashGiven?: number;
  changeDue?: number;
  status: string;
  createdAt: string;
  syncedAt?: string;
}

// In-memory store (acts as cloud DB)
const masterProducts: Product[] = [
  {
    id: "prod-1",
    name: "Espresso Single",
    category: "Coffee",
    price: 18000,
    stock: 100,
    image: "☕",
  },
  {
    id: "prod-2",
    name: "Iced Americano",
    category: "Coffee",
    price: 24000,
    stock: 120,
    image: "🧊",
  },
  {
    id: "prod-3",
    name: "Cafe Latte",
    category: "Coffee",
    price: 28000,
    stock: 90,
    image: "🥛",
  },
  {
    id: "prod-4",
    name: "Caramel Macchiato",
    category: "Coffee",
    price: 32000,
    stock: 75,
    image: "🍯",
  },
  {
    id: "prod-5",
    name: "Matcha Latte",
    category: "Non-Coffee",
    price: 29000,
    stock: 80,
    image: "🍵",
  },
  {
    id: "prod-6",
    name: "Artisan Chocolate",
    category: "Non-Coffee",
    price: 27000,
    stock: 60,
    image: "🍫",
  },
  {
    id: "prod-7",
    name: "Butter Croissant",
    category: "Pastry",
    price: 22000,
    stock: 40,
    image: "🥐",
  },
  {
    id: "prod-8",
    name: "Pain Au Chocolat",
    category: "Pastry",
    price: 26000,
    stock: 35,
    image: "🥖",
  },
  {
    id: "prod-9",
    name: "Cinnamon Roll",
    category: "Pastry",
    price: 25000,
    stock: 30,
    image: "🥨",
  },
];

const cloudOrders: Order[] = [];

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    app: "POS Cloud Sync Server",
    timestamp: new Date().toISOString(),
    totalSyncedOrders: cloudOrders.length,
  });
});

// Master Products
app.get("/api/products", (c) => {
  return c.json({
    success: true,
    data: masterProducts,
  });
});

// Sync orders from desktop POS
app.post("/api/sync/orders", async (c) => {
  const body = await c.req.json();
  const incomingOrders: Order[] = Array.isArray(body) ? body : body.orders || [];

  const syncedIds: string[] = [];
  const now = new Date().toISOString();

  for (const order of incomingOrders) {
    const existingIndex = cloudOrders.findIndex((o) => o.id === order.id);
    const enrichedOrder = {
      ...order,
      syncedAt: now,
    };

    if (existingIndex >= 0) {
      cloudOrders[existingIndex] = enrichedOrder;
    } else {
      cloudOrders.push(enrichedOrder);
    }
    syncedIds.push(order.id);
  }

  console.log(`[Cloud Sync] Received ${incomingOrders.length} orders. Total cloud orders: ${cloudOrders.length}`);

  return c.json({
    success: true,
    message: `Successfully synced ${syncedIds.length} orders`,
    syncedIds,
    syncedAt: now,
  });
});

// Dashboard stats for SaaS management
app.get("/api/dashboard/stats", (c) => {
  const totalRevenue = cloudOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = cloudOrders.length;

  return c.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      recentOrders: cloudOrders.slice(-10).reverse(),
    },
  });
});

const port = Number(process.env.PORT) || 3001;
console.log(`🚀 POS Cloud API running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};