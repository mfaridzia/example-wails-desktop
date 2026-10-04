package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type SyncWorker struct {
	db        *DBManager
	ctx       context.Context
	serverURL string
	client    *http.Client
	isOnline  bool
	lastSync  string
}

type SyncResponse struct {
	Success   bool     `json:"success"`
	Message   string   `json:"message"`
	SyncedIDs []string `json:"syncedIds"`
	SyncedAt  string   `json:"syncedAt"`
}

func NewSyncWorker(db *DBManager, serverURL string) *SyncWorker {
	return &SyncWorker{
		db:        db,
		serverURL: serverURL,
		client: &http.Client{
			Timeout: 4 * time.Second,
		},
		isOnline: false,
	}
}

func (s *SyncWorker) Start(ctx context.Context) {
	s.ctx = ctx
	log.Printf("[SyncWorker] Starting background worker targeting %s", s.serverURL)

	// Run first sync check immediately in goroutine
	go s.performSync()

	// Ticker every 10 seconds
	ticker := time.NewTicker(10 * time.Second)
	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("[SyncWorker] Stopped background sync worker")
				return
			case <-ticker.C:
				s.performSync()
			}
		}
	}()
}

func (s *SyncWorker) checkHealth() bool {
	resp, err := s.client.Get(s.serverURL + "/")
	if err != nil {
		s.isOnline = false
		return false
	}
	defer resp.Body.Close()
	s.isOnline = (resp.StatusCode == http.StatusOK)
	return s.isOnline
}

func (s *SyncWorker) performSync() (int, error) {
	online := s.checkHealth()
	pending, _ := s.db.CountPendingSync()

	if !online {
		s.notifyFrontend()
		return 0, fmt.Errorf("server offline")
	}

	if pending == 0 {
		s.notifyFrontend()
		return 0, nil
	}

	unsynced, err := s.db.GetUnsyncedOrders()
	if err != nil {
		s.notifyFrontend()
		return 0, err
	}

	payload, err := json.Marshal(unsynced)
	if err != nil {
		s.notifyFrontend()
		return 0, err
	}

	resp, err := s.client.Post(s.serverURL+"/api/sync/orders", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		s.isOnline = false
		s.notifyFrontend()
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.notifyFrontend()
		return 0, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var syncResp SyncResponse
	if err := json.NewDecoder(resp.Body).Decode(&syncResp); err != nil {
		s.notifyFrontend()
		return 0, err
	}

	if syncResp.Success && len(syncResp.SyncedIDs) > 0 {
		_ = s.db.MarkOrdersSynced(syncResp.SyncedIDs, syncResp.SyncedAt)
		s.lastSync = time.Now().Format("15:04:05")
		log.Printf("[SyncWorker] Synced %d orders to cloud successfully!", len(syncResp.SyncedIDs))
	}

	s.notifyFrontend()
	return len(syncResp.SyncedIDs), nil
}

func (s *SyncWorker) notifyFrontend() {
	if s.ctx == nil {
		return
	}
	status := s.GetStatus()
	runtime.EventsEmit(s.ctx, "sync:status", status)
}

func (s *SyncWorker) GetStatus() SyncStatus {
	pending, _ := s.db.CountPendingSync()
	return SyncStatus{
		IsOnline:     s.isOnline,
		PendingCount: pending,
		LastSyncAt:   s.lastSync,
		ServerURL:    s.serverURL,
	}
}
