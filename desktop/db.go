package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type Product struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	Stock    int     `json:"stock"`
	Image    string  `json:"image"`
}

type OrderItem struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
	Subtotal  float64 `json:"subtotal"`
}

type Order struct {
	ID            string      `json:"id"`
	OrderNumber   string      `json:"orderNumber"`
	OutletID      string      `json:"outletId"`
	CustomerName  string      `json:"customerName"`
	Items         []OrderItem `json:"items"`
	TotalAmount   float64     `json:"totalAmount"`
	PaymentMethod string      `json:"paymentMethod"`
	CashGiven     float64     `json:"cashGiven"`
	ChangeDue     float64     `json:"changeDue"`
	Status        string      `json:"status"`
	IsSynced      bool        `json:"isSynced"`
	CreatedAt     string      `json:"createdAt"`
	SyncedAt      string      `json:"syncedAt,omitempty"`
}

type SyncStatus struct {
	IsOnline     bool   `json:"isOnline"`
	PendingCount int    `json:"pendingCount"`
	LastSyncAt   string `json:"lastSyncAt"`
	ServerURL    string `json:"serverUrl"`
}

type DashboardMetrics struct {
	TotalRevenue float64 `json:"totalRevenue"`
	TotalOrders  int     `json:"totalOrders"`
	PendingSync  int     `json:"pendingSync"`
	TopProduct   string  `json:"topProduct"`
}

type DBManager struct {
	db *sql.DB
}

func InitDB() (*DBManager, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	appDir := filepath.Join(homeDir, ".pos-desktop")
	_ = os.MkdirAll(appDir, 0755)

	dbPath := filepath.Join(appDir, "pos_local.db")
	log.Printf("[DB] Initializing SQLite database at %s", dbPath)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite: %w", err)
	}

	// Performance pragmas for local SQLite
	_, _ = db.Exec("PRAGMA journal_mode=WAL;")
	_, _ = db.Exec("PRAGMA synchronous=NORMAL;")

	mgr := &DBManager{db: db}
	if err := mgr.migrate(); err != nil {
		return nil, err
	}
	if err := mgr.seedProducts(); err != nil {
		log.Printf("[DB] Warning seeding products: %v", err)
	}

	return mgr, nil
}

func (m *DBManager) Close() {
	if m.db != nil {
		_ = m.db.Close()
	}
}

func (m *DBManager) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS products (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		price REAL NOT NULL,
		stock INTEGER NOT NULL,
		image TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS orders (
		id TEXT PRIMARY KEY,
		order_number TEXT NOT NULL,
		outlet_id TEXT NOT NULL,
		customer_name TEXT,
		items_json TEXT NOT NULL,
		total_amount REAL NOT NULL,
		payment_method TEXT NOT NULL,
		cash_given REAL DEFAULT 0,
		change_due REAL DEFAULT 0,
		status TEXT NOT NULL,
		is_synced INTEGER DEFAULT 0,
		created_at TEXT NOT NULL,
		synced_at TEXT
	);

	CREATE INDEX IF NOT EXISTS idx_orders_sync ON orders(is_synced);
	CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
	`
	_, err := m.db.Exec(schema)
	return err
}

func (m *DBManager) seedProducts() error {
	var count int
	err := m.db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if err != nil || count > 0 {
		return nil
	}

	seeds := []Product{
		{ID: "prod-1", Name: "Espresso Single", Category: "Coffee", Price: 18000, Stock: 100, Image: "☕"},
		{ID: "prod-2", Name: "Iced Americano", Category: "Coffee", Price: 24000, Stock: 120, Image: "🧊"},
		{ID: "prod-3", Name: "Cafe Latte", Category: "Coffee", Price: 28000, Stock: 90, Image: "🥛"},
		{ID: "prod-4", Name: "Caramel Macchiato", Category: "Coffee", Price: 32000, Stock: 75, Image: "🍯"},
		{ID: "prod-5", Name: "Matcha Latte", Category: "Non-Coffee", Price: 29000, Stock: 80, Image: "🍵"},
		{ID: "prod-6", Name: "Artisan Chocolate", Category: "Non-Coffee", Price: 27000, Stock: 60, Image: "🍫"},
		{ID: "prod-7", Name: "Butter Croissant", Category: "Pastry", Price: 22000, Stock: 40, Image: "🥐"},
		{ID: "prod-8", Name: "Pain Au Chocolat", Category: "Pastry", Price: 26000, Stock: 35, Image: "🥖"},
		{ID: "prod-9", Name: "Cinnamon Roll", Category: "Pastry", Price: 25000, Stock: 30, Image: "🥨"},
	}

	tx, err := m.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT INTO products (id, name, category, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, p := range seeds {
		if _, err := stmt.Exec(p.ID, p.Name, p.Category, p.Price, p.Stock, p.Image); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (m *DBManager) GetProducts() ([]Product, error) {
	rows, err := m.db.Query("SELECT id, name, category, price, stock, image FROM products ORDER BY category, name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.Image); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (m *DBManager) CreateOrder(order Order) (Order, error) {
	if order.ID == "" {
		order.ID = fmt.Sprintf("ord-%d", time.Now().UnixNano())
	}
	if order.OrderNumber == "" {
		order.OrderNumber = fmt.Sprintf("#POS-%s", time.Now().Format("0102-150405"))
	}
	if order.CreatedAt == "" {
		order.CreatedAt = time.Now().Format(time.RFC3339)
	}
	if order.Status == "" {
		order.Status = "COMPLETED"
	}
	order.IsSynced = false

	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return order, fmt.Errorf("failed to marshal items: %w", err)
	}

	_, err = m.db.Exec(`
		INSERT INTO orders (
			id, order_number, outlet_id, customer_name, items_json,
			total_amount, payment_method, cash_given, change_due, status, is_synced, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
		order.ID, order.OrderNumber, order.OutletID, order.CustomerName, string(itemsJSON),
		order.TotalAmount, order.PaymentMethod, order.CashGiven, order.ChangeDue, order.Status, order.CreatedAt,
	)
	if err != nil {
		return order, fmt.Errorf("failed to insert order: %w", err)
	}

	return order, nil
}

func (m *DBManager) GetOrders(limit int) ([]Order, error) {
	query := `
		SELECT id, order_number, outlet_id, customer_name, items_json,
		       total_amount, payment_method, cash_given, change_due, status, is_synced, created_at, COALESCE(synced_at, '')
		FROM orders ORDER BY created_at DESC LIMIT ?`
	rows, err := m.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var itemsJSON string
		var isSyncedInt int
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.OutletID, &o.CustomerName, &itemsJSON,
			&o.TotalAmount, &o.PaymentMethod, &o.CashGiven, &o.ChangeDue, &o.Status,
			&isSyncedInt, &o.CreatedAt, &o.SyncedAt,
		); err != nil {
			return nil, err
		}
		o.IsSynced = (isSyncedInt == 1)
		_ = json.Unmarshal([]byte(itemsJSON), &o.Items)
		orders = append(orders, o)
	}
	return orders, nil
}

func (m *DBManager) GetUnsyncedOrders() ([]Order, error) {
	query := `
		SELECT id, order_number, outlet_id, customer_name, items_json,
		       total_amount, payment_method, cash_given, change_due, status, created_at
		FROM orders WHERE is_synced = 0 ORDER BY created_at ASC`
	rows, err := m.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var itemsJSON string
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.OutletID, &o.CustomerName, &itemsJSON,
			&o.TotalAmount, &o.PaymentMethod, &o.CashGiven, &o.ChangeDue, &o.Status, &o.CreatedAt,
		); err != nil {
			return nil, err
		}
		o.IsSynced = false
		_ = json.Unmarshal([]byte(itemsJSON), &o.Items)
		orders = append(orders, o)
	}
	return orders, nil
}

func (m *DBManager) MarkOrdersSynced(ids []string, syncedAt string) error {
	if len(ids) == 0 {
		return nil
	}
	tx, err := m.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("UPDATE orders SET is_synced = 1, synced_at = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		if _, err := stmt.Exec(syncedAt, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (m *DBManager) CountPendingSync() (int, error) {
	var count int
	err := m.db.QueryRow("SELECT COUNT(*) FROM orders WHERE is_synced = 0").Scan(&count)
	return count, err
}

func (m *DBManager) GetMetrics() (DashboardMetrics, error) {
	var metrics DashboardMetrics
	_ = m.db.QueryRow("SELECT COALESCE(SUM(total_amount), 0), COUNT(*) FROM orders").Scan(&metrics.TotalRevenue, &metrics.TotalOrders)
	_ = m.db.QueryRow("SELECT COUNT(*) FROM orders WHERE is_synced = 0").Scan(&metrics.PendingSync)
	metrics.TopProduct = "Iced Americano"
	return metrics, nil
}
