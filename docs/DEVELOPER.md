# Developer Guide

This document covers everything you need to set up, run, and extend Spare Pit. For end-user documentation, see the main [README](../README.md).

**Contents**
1. [Quick Start](#quick-start)
1. [Deployment](#deployment)
1. [Database: Supabase vs. SQLite](#database-supabase-vs-sqlite)
1. [Server Architecture](#server-architecture)
1. [API Reference](#api-reference)
1. [Troubleshooting](#troubleshooting)

---

## Remote Deployment (Online)

[Deployment Guide](https://docs.google.com/document/d/1L76iXOH6ml9GdBn7CURlDEe_7l-3rIdocH12cPhhZ44)
> This guide covers how to deploy the frontend, backend, and database to be publicly accessible to highschool students.

---

## Local Deployment

### Fork and Clone

**Prerequisites:** Free GitHub account, code editor such as VS Code

1. Go to the repository: https://github.com/AugleBoBaugles/spare-pit
2. Click the **Fork** button in the top-right corner to create your own copy of the repo
3. In your forked repo, click the green **Code** button and copy the HTTPS URL
4. Open a terminal and run:

```
git clone <your-forked-repo-url>
cd spare-pit
```

### Database Setup

The app supports two database modes. **Choose one before starting the server.**

---

#### Option A — Supabase (shared cloud database, recommended for team use)

This is the default. All team members connect to the same database, so changes are visible instantly to everyone.

**Step 1 — Create a Supabase project**

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Click **New project**, give it a name (e.g. `frc-inventory`), and wait for it to provision

**Step 2 — Create the inventory table**

1. In your project, open **SQL Editor → New Query**
2. Paste the entire contents of [`server/db/supabase-schema.sql`](../server/db/supabase-schema.sql) and click **Run**

**Step 3 — Get your connection string**

1. Go to **Settings → Database → Connection string**
2. Select the **Transaction pooler** tab
3. Copy the connection string — it looks like:
   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-<region>.pooler.supabase.com:6543/postgres
   ```

**Step 4 — Configure the server**

```bash
cd server
cp .env.example .env
```

Open `server/.env` and paste your connection string as the value of `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

**Step 5 — Verify the connection**

```bash
cd server
npm install
npm run init-db
```

A successful run prints `Supabase inventory table verified.` If you see an error, double-check your `DATABASE_URL` and confirm the schema was applied in Step 2.

---

#### Option B — Local SQLite (no internet required, single-machine only)

Use this when you want to run the app locally without setting up Supabase — useful for frontend development or quick testing. Data lives in a local file and is **not shared between machines**.

No configuration is needed. See [Local SQLite Development](#local-sqlite-development) for how to switch the app to this mode.

---

### Run the App

Run from the root of the project:

#### Windows (Command Prompt)
```
start.bat
```

#### macOS / Linux / Git Bash
```
./start.sh
```

---



## Database: Supabase vs. SQLite

The app ships with two complete database backends. **Supabase (PostgreSQL via `pg`)** is the default for shared, persistent data. **SQLite** is kept as a local-only alternative for development without internet access.

| | Supabase (default) | SQLite (local dev) |
|---|---|---|
| Shared across machines | Yes | No |
| Data persists across restarts | Yes | Yes (local file) |
| Setup required | Yes (see Quick Start) | None |
| Connection file | `server/db/db.js` | `server/db/db.sqlite.js` |
| Model file | `server/models/inventoryModel.supabase.js` | `server/models/inventoryModel.sqlite.js` |

### Local SQLite Development

To run the app with a local SQLite database instead of Supabase:

1. **Swap the model import** in [`server/services/inventoryService.js`](../server/services/inventoryService.js):
   ```js
   // Change this line:
   import { ... } from '../models/inventoryModel.supabase.js';
   // To this:
   import { ... } from '../models/inventoryModel.sqlite.js';
   ```

2. **No `.env` needed.** The SQLite connection (`db.sqlite.js`) is self-initializing — it creates `server/db/frc-inventory.db` and the inventory table automatically on first use.

3. **Start the server normally.** `npm run dev` or `npm start` from the `server/` directory.

> **Note:** `npm run init-db`, `npm run reset-db`, and `npm run seed-db` all talk to Supabase (they import from the default `db.js`). When running in SQLite mode, skip those scripts — the database is initialized automatically on first connection.

### Environment Variables

| Variable | Required for | Description |
|---|---|---|
| `DATABASE_URL` | Supabase mode | Transaction Pooler connection string from Supabase dashboard |

No environment variables are needed for local SQLite development.

### DB Schema

The Supabase schema is in [`server/db/supabase-schema.sql`](../server/db/supabase-schema.sql). The SQLite schema is embedded in [`server/db/db.sqlite.js`](../server/db/db.sqlite.js).

```mermaid
erDiagram
    INVENTORY {
        int    id
        string name
        string type
        string area
        string location
        string status
        int    quantity
        string condition
        string itemImage
        string checkOutBy
        timestamp lastUpdated
        string tags
        string notes
        int    needsRestock
    }
```

---

## Server Architecture

Incoming requests travel through a chain of layers, each with a single responsibility:

```
App → Routers → Controllers → Services → Models → DB
```

**App** (`app.js`) is the entry point. It sets up Express and connects the routers.

**Routers** (`routes/`) define the URL paths (like `GET /api/inventory`) and hand each request off to the right controller.

**Controllers** (`controllers/`) receive the request, call the appropriate service, and send the response back to the client with the right status code (200 for success, 500 if something went wrong).

**Services** (`services/`) contain the business logic. This is where rules like filtering, sorting, or validating data would live.

**Models** (`models/`) are the only layer that talks to the database directly. They contain the SQL queries and return raw results up to the service.

**DB** (`db/db.js`) opens and manages the database connection.

---

## API Reference

### DELETE /api/inventory/:id

Permanently removes an item from the inventory.

**Success response (200):**
```json
{
  "message": "Cordless Drill has been deleted from the inventory",
  "deleted": { "id": 1, "name": "Cordless Drill", ... }
}
```

**Error responses:**
| Status | Condition |
|---|---|
| 404 | No item with the given `:id` exists in the database |
| 500 | Unexpected server error |

**Frontend data flow:**
```
User clicks Delete
  → handleDeleteClick() closes the dropdown and opens DeleteConfirmModal
  → User types "DELETE" and clicks Confirm
  → DeleteConfirmModal calls deleteInventory(id) (DELETE /api/inventory/:id)
  → On success: onDelete(id) removes the item from useInventory state; modal closes
  → On failure: onError(msg) sets deleteError in InventoryRow; modal closes; error row renders
```

---

## Troubleshooting

### Reset Database

> **Warning:** This will delete ALL the contents of your database. Proceed with caution!

**Supabase (default):** Clears all rows from the cloud inventory table.
```bash
npm run reset-db
```

**SQLite (local dev):** Deletes and recreates the local database file.
```bash
cd server
node -e "import('./db/deleteDb.sqlite.js').then(m => m.deleteDb())"
node scripts/initDbScript.js    # re-initialize with SQLite (swap imports first — see Local SQLite Development)
```
