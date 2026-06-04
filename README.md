# Spare Pit

This inventory app was designed by Green River College students Augy Markham and Rebecca Riffle  to help First Robotics Competition teams track and manage inventory.

**Contents**
1. [Quick Start](#quick-start)
1. [User Guide](#user-guide)
1. [Developer Notes](#developer-notes)

## Quick Start
### Fork and Clone repo
Prerequisite: Free GitHub account, code editor such as VS Code

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
2. Paste the entire contents of [`server/db/supabase-schema.sql`](server/db/supabase-schema.sql) and click **Run**

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

No configuration is needed. See [Local SQLite Development](#local-sqlite-development) in the Developer Notes for how to switch the app to this mode.

---

### Run Start Script
*This should be done from the root of the project*
#### Windows (Command Prompt)
```
start.bat
```
#### macOS / Linux / Git Bash
``` 
./start.sh
```

## User Guide
**Contents**

1. [Viewing and Editing Inventory](#viewing-and-editing-inventory)
1. [Deleting an Item](#deleting-an-item)
1. [Dark Mode](#dark-mode)
1. [Troubleshooting](#troubleshooting)

### Viewing and Editing Inventory

#### Browsing the inventory

The inventory page shows a table of all tools, parts, and materials your team has logged. Each row shows the item name, type, location, and current status.

Click any row to expand it and see more details — area, quantity, condition, tags, and notes.

Click the row again to collapse it.

#### Status meanings

| Status | What it means |
|---|---|
| Available | In the pit and ready to use |
| Checked out | Signed out by a subteam — see "Checked out by" for who has it |
| Maintenance | Out of service, do not use |
| Missing | Cannot be located — report to a lead if you find it |

#### Editing an item

1. Find the item in the inventory list. Use the search bar at the top to filter by name, type, location, or status.
2. Click the **⋯** button at the right end of the row to open the actions menu.
3. Click **Edit**. The row expands and all fields become editable inputs.
4. Make your changes. Required fields (marked with **\***) cannot be left blank.
5. If you set the status to **Checked out**, a "Checked out by" field will appear — enter your subteam name (e.g. `electrical`, `programming`).
6. Click **Save** to apply your changes, or **Cancel** to discard them and go back to the read view.

If something goes wrong when saving, an error message will appear below the form. Your edits are preserved so you can try again.

### Deleting an Item

Use this when a tool should be permanently removed from the inventory — for example, when it has been retired from the team's kit or when a duplicate entry needs to be cleaned up.

1. Find the item in the inventory list.
2. Click the **⋯** button at the right end of the row to open the actions menu.
3. Click **Delete** (shown in red to signal it is a destructive action).
4. A confirmation dialog will appear. Type `DELETE` (all caps, case-sensitive) into the text box to confirm.
5. Click **Confirm** to permanently remove the item, or **Cancel** to go back without making any changes.

If the delete fails (for example, due to a network error), the dialog will close and an error message will appear below the item row. The item will remain in the inventory — you can try again.

> **Warning:** Deleting an item is permanent and cannot be undone. Make sure you have the right item before confirming.

### Dark Mode

Spare Pit supports light and dark mode so you can view the inventory comfortably in any environment.

A dark mode toggle sits in the **upper-right corner** of every page.

- Sun - Light Mode
- Moon - Dark Mode

Click the toggle once to switch modes. The preference is active for the current session.

### Troubleshooting
#### Reset Database
*Warning: This will delete ALL the contents of your database. Proceed with caution!*

**Supabase (default):** Clears all rows from the cloud inventory table.
```
npm run reset-db
```

**SQLite (local dev):** Deletes and recreates the local database file.
```bash
cd server
node -e "import('./db/deleteDb.sqlite.js').then(m => m.deleteDb())"
node scripts/initDbScript.js    # re-initialize with SQLite (swap imports first — see Local SQLite Development)
```
## Developer Notes

### Database: Supabase vs. SQLite

The app ships with two complete database backends. **Supabase (PostgreSQL via `pg`)** is the default for shared, persistent data. **SQLite** is kept as a local-only alternative for development without internet access.

| | Supabase (default) | SQLite (local dev) |
|---|---|---|
| Shared across machines | Yes | No |
| Data persists across restarts | Yes | Yes (local file) |
| Setup required | Yes (see Quick Start) | None |
| Connection file | `server/db/db.js` | `server/db/db.sqlite.js` |
| Model file | `server/models/inventoryModel.js` | `server/models/inventoryModel.sqlite.js` |

#### Local SQLite Development

To run the app with a local SQLite database instead of Supabase:

1. **Swap the model import** in [`server/services/inventoryService.js`](server/services/inventoryService.js):
   ```js
   // Change this line:
   import { ... } from '../models/inventoryModel.js';
   // To this:
   import { ... } from '../models/inventoryModel.sqlite.js';
   ```

2. **No `.env` needed.** The SQLite connection (`db.sqlite.js`) is self-initializing — it creates `server/db/frc-inventory.db` and the inventory table automatically on first use.

3. **Start the server normally.** `npm run dev` or `npm start` from the `server/` directory.

> **Note:** `npm run init-db`, `npm run reset-db`, and `npm run seed-db` all talk to Supabase (they import from the default `db.js`). When running in SQLite mode, skip those scripts — the database is initialized automatically on first connection.

#### Environment Variables

| Variable | Required for | Description |
|---|---|---|
| `DATABASE_URL` | Supabase mode | Transaction Pooler connection string from Supabase dashboard |

No environment variables are needed for local SQLite development.

#### DB Schema

The Supabase schema is in [`server/db/supabase-schema.sql`](server/db/supabase-schema.sql). The SQLite schema is embedded in [`server/db/db.sqlite.js`](server/db/db.sqlite.js).

```mermaid
erDiagram
    INVENTORY {
        bigint id PK
        text name
        text type
        text area
        text location
        text status
        integer quantity
        text condition
        text itemImage
        text checkOutBy
        timestamptz lastUpdated
        text tags
        text notes
    }
```

#### File Map

```
server/db/
  db.js              Supabase — pg Pool, reads DATABASE_URL
  db.sqlite.js       SQLite — self-initializing local connection
  initDb.js          Supabase — verifies table access at startup
  initDb.sqlite.js   SQLite — creates table if missing (reference)
  deleteDb.js        Supabase — clears all rows
  deleteDb.sqlite.js SQLite — deletes the .db file
  supabase-schema.sql  Run this in Supabase SQL Editor to create the table

server/models/
  inventoryModel.js         Supabase — raw SQL via pg
  inventoryModel.sqlite.js  SQLite — raw SQL via sqlite driver
```

### Server Architecture

Incoming requests travel through a chain of layers, each with a single responsibility:

```
App -> Routers -> Controllers -> Services -> Models -> DB
```

**App** (`app.js`) is the entry point. It sets up Express and connects the routers.

**Routers** (`routes/`) define the URL paths (like `GET /api/inventory`) and hand each request off to the right controller.

**Controllers** (`controllers/`) receive the request, call the appropriate service, and send the response back to the client with the right status code (200 for success, 500 if something went wrong).

**Services** (`services/`) contain the business logic. This is where rules like filtering, sorting, or validating data would live.

**Models** (`models/`) are the only layer that talks to the database directly. They contain the SQL queries and return raw results up to the service.

**DB** (`db/db.js`) creates and caches the database connection (Supabase by default).

### Delete Inventory Item

**Route:** `DELETE /api/inventory/:id`

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