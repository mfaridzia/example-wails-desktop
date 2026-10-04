# Wails Offline-First Desktop Architecture

An example implementation demonstrating an **offline-first desktop application architecture** built with **Wails v2 (Go)**, **React 19**, **Zero-CGO SQLite**, and a **Bun/Hono** cloud synchronization service.

This repository serves as a practical architectural reference for building lightweight, memory-efficient cross-platform desktop applications (~13 MB binary, ~30–50 MB RAM) as an alternative to resource-heavy Electron implementations.

---

## 🏛️ Architecture Overview

The system employs a client-side **Local-First / Offline-First** pattern. All mutations and transactional operations are executed against a local embedded database before being asynchronously propagated to upstream cloud services.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DESKTOP CLIENT PROCESS                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     Frontend Presentation                      │   │
│   │         React 19 + TypeScript + Vite + Tailwind CSS            │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Strongly-typed IPC Bindings        │
│                                   │ (Generated TS Definitions)         │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │                      Native Backend (Go)                       │   │
│   │  • Application Controller & IPC Dispatcher                     │   │
│   │  • Local SQLite Storage Manager (WAL Mode, Zero-CGO)           │   │
│   │  • Asynchronous Background Sync Worker (Goroutines & Channels) │   │
│   │  • Hardware / Raw Output Formatting Engine                     │   │
│   └──────────────┬───────────────────────────────────┬─────────────┘   │
└──────────────────┼───────────────────────────────────┼─────────────────┘
                   │ Direct I/O                        │ HTTPS / JSON
                   ▼                                   ▼
        ┌──────────────────────┐            ┌────────────────────────┐
        │ Local Embedded DB    │            │ Cloud Synchronization  │
        │ SQLite (`~/.app/`)   │            │ Service (Bun + Hono)   │
        └──────────────────────┘            └────────────────────────┘
```

---

## 🛠️ Tech Stack & Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Desktop Shell** | [Wails v2](https://wails.io/) | Eliminates bundling embedded Chromium or Node.js runtimes. Renders via native OS webview (WebView2 on Windows, WebKit on macOS/Linux), resulting in sub-15MB binaries and ~30–50MB memory footprint. |
| **Native Runtime** | **Go (Golang)** | Fast compilation, stable concurrency via goroutines, memory safety without steep lifetime management overhead, and cross-platform native binaries. |
| **Local Database** | [modernc.org/sqlite](https://gitlab.com/cznic/sqlite) | Pure Go implementation of SQLite that requires **zero CGO**. Compiles effortlessly across target operating systems without external C toolchain dependencies. |
| **UI Framework** | **React 19 + Vite** | Modern reactive UI paradigm paired with instant Hot Module Replacement (HMR) during desktop development. |
| **Styling** | **Tailwind CSS v4** | Utility-first CSS compiling minimal scoped stylesheets. |
| **Cloud Service** | **Bun + Hono** | Ultra-fast TypeScript backend runtime and lightweight API framework to simulate upstream sync endpoints. |

---

## 🔄 Offline-First Synchronization Model

### 1. Local Mutation Guarantee
* Every write transaction is committed directly to the local SQLite database first.
* A schema-level tracking field (`is_synced BOOLEAN DEFAULT false`, `created_at`, `synced_at`) marks the state of each record.
* UI operations return immediately upon local commit without waiting for network availability.

### 2. Autonomous Background Sync Worker
* A persistent background Goroutine executes on a scheduled interval (default: 10s) and is also triggered on-demand following local transactions.
* **Health Check & Circuit Breaker**: The worker performs a lightweight handshake with the upstream cloud endpoint. If unavailable, it backs off without blocking application responsiveness.
* **Batch Dispatch**: When connectivity is verified, uncommitted records (`WHERE is_synced = 0`) are batched and dispatched via HTTPS `POST`.
* **State Reconciliation**: Upon receiving an acknowledgment (`200 OK`) with synced IDs, the worker executes a batched `UPDATE` locally setting `is_synced = 1` and recording `synced_at`.
* **Realtime Event Dispatch**: The worker emits status updates over Wails runtime events (`sync:status`), allowing the frontend UI to display real-time synchronization badges (Online / Offline / Pending counts) reactively.

---

## 🔌 Type-Safe IPC (Inter-Process Communication)

Wails automatically parses Go structs and public methods on the application controller, generating complete TypeScript classes and typed async caller functions:

```go
// Go Backend Definition
func (a *App) CreateOrder(order Order) (*Order, error) { ... }
func (a *App) GetSyncStatus() SyncStatus { ... }
```

```typescript
// Auto-generated TypeScript bindings in frontend
import { CreateOrder, GetSyncStatus } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";

const status: main.SyncStatus = await GetSyncStatus();
```

No manual REST or WebSocket wrappers are required between the desktop frontend and native Go runtime.

---

## 📁 Repository Structure

```text
.
├── desktop/                  # Wails Desktop Application
│   ├── app.go                # Application controller & exposed IPC methods
│   ├── db.go                 # SQLite database manager & migration schemas
│   ├── sync.go               # Background sync worker & network health loop
│   ├── receipt.go            # Raw monospace/thermal layout formatter
│   ├── main.go               # Application entrypoint & window configuration
│   ├── wails.json            # Wails configuration manifest
│   └── frontend/             # React + Vite application
│       ├── src/              # UI components & application state
│       └── wailsjs/          # Generated Go-to-TypeScript bindings
└── server/                   # Upstream Cloud API (Bun + Hono)
    ├── index.ts              # Sync ingestion & master data endpoints
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
* **Go** (1.23+)
* **Wails v2 CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
* **Bun** or **Node.js**

### 1. Start Cloud Synchronization Service
```bash
cd server
bun run index.ts
```
The cloud sync endpoint will listen on `http://localhost:3001`.

### 2. Run Desktop Client in Development Mode
```bash
cd desktop
wails dev
```
Hot-reload is active: changes to either frontend code (`frontend/src`) or native Go files will automatically recompile and reload the desktop window.

### 3. Build Production Executable
```bash
cd desktop
wails build
```
The compiled, standalone native binary will be generated under:
* macOS: `desktop/build/bin/desktop.app`
* Windows: `desktop/build/bin/desktop.exe`
* Linux: `desktop/build/bin/desktop`
