package main

import (
	"context"
	"fmt"
	"log"
)

// App struct
type App struct {
	ctx        context.Context
	db         *DBManager
	syncWorker *SyncWorker
}

// NewApp creates a new App application struct
func NewApp() *App {
	db, err := InitDB()
	if err != nil {
		log.Fatalf("Fatal database error: %v", err)
	}

	cloudURL := "http://localhost:3001"
	worker := NewSyncWorker(db, cloudURL)

	return &App{
		db:         db,
		syncWorker: worker,
	}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.syncWorker.Start(ctx)
}

// shutdown is called when the app terminates.
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// GetProducts returns all menu products from local SQLite
func (a *App) GetProducts() []Product {
	products, err := a.db.GetProducts()
	if err != nil {
		log.Printf("[App] Error getting products: %v", err)
		return []Product{}
	}
	return products
}

// CreateOrder saves a new order into SQLite and tries to sync
func (a *App) CreateOrder(order Order) (*Order, error) {
	created, err := a.db.CreateOrder(order)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Trigger async sync attempt immediately in background
	go func() {
		_, _ = a.syncWorker.performSync()
	}()

	return &created, nil
}

// GetOrders returns recent orders from SQLite
func (a *App) GetOrders(limit int) []Order {
	if limit <= 0 {
		limit = 50
	}
	orders, err := a.db.GetOrders(limit)
	if err != nil {
		log.Printf("[App] Error getting orders: %v", err)
		return []Order{}
	}
	return orders
}

// GetSyncStatus returns sync worker state
func (a *App) GetSyncStatus() SyncStatus {
	return a.syncWorker.GetStatus()
}

// TriggerSync manually executes a sync
func (a *App) TriggerSync() string {
	synced, err := a.syncWorker.performSync()
	if err != nil {
		return fmt.Sprintf("Sync gagal: %v", err)
	}
	if synced == 0 {
		return "Semua data sudah tersinkronisasi!"
	}
	return fmt.Sprintf("Berhasil menyinkronkan %d transaksi!", synced)
}

// GetReceiptText returns formatted thermal receipt string
func (a *App) GetReceiptText(orderID string) (string, error) {
	orders, err := a.db.GetOrders(100)
	if err != nil {
		return "", err
	}

	for _, o := range orders {
		if o.ID == orderID {
			return GenerateReceiptText(o), nil
		}
	}
	return "", fmt.Errorf("order not found: %s", orderID)
}

// GetMetrics returns stats for the dashboard
func (a *App) GetMetrics() DashboardMetrics {
	metrics, err := a.db.GetMetrics()
	if err != nil {
		log.Printf("[App] Error getting metrics: %v", err)
		return DashboardMetrics{}
	}
	return metrics
}
