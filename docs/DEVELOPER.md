# Developer Guide

This document covers everything you need to set up, run, and extend Spare Pit. For end-user documentation, see the main [README](../README.md).

**Contents**
1. [Remote Deployment (Online)](#remote-deployment-online)
1. [Local Deployment](#local-deployment)
1. [Choosing a Database](#choosing-a-database)
1. [Server Architecture](#server-architecture)
1. [API Reference](#api-reference)
1. [Troubleshooting](#troubleshooting)

---

## Remote Deployment (Online)

[Deployment Guide](https://docs.google.com/document/d/1L76iXOH6ml9GdBn7CURlDEe_7l-3rIdocH12cPhhZ44)
> This guide covers how to deploy the frontend, backend, and database to be publicly accessible to highschool students.

### Environment Variables for Deployment

These environment variables must be set on your hosting platforms for the deployed app to work correctly.

**Backend (Render) — set these:**

| Variable | Value |
|---|---|
| `DB_CLIENT` | `postgres` |
| `DATABASE_URL` | Your Supabase Transaction Pooler connection string |
| `CORS_ORIGIN` | The full URL of your deployed frontend, e.g. `https://your-app.netlify.app` |

`CORS_ORIGIN` tells the server which frontend origin is allowed to make API requests. Without it, browsers will block all requests from the frontend with a CORS error.

**Frontend (Netlify) — set this:**

| Variable | Value |
|---|---|
| `VITE_API_BASE` | The full URL of your deployed backend, e.g. `https://your-app.onrender.com` |

`VITE_API_BASE` tells the frontend where to send API requests. Without it, the frontend will try to call `/api/...` on its own URL instead of the backend.

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

Spare Pit runs on either **SQLite** (a single file on one computer) or **PostgreSQL** (Supabase, or a Postgres server you run yourself). You pick one with the `DB_CLIENT` setting in `server/.env`; no code changes are needed. See [Choosing a Database](#choosing-a-database) to decide.

Start by creating your config file:

```bash
cd server
cp .env.example .env
```

---

#### Option A — SQLite (simplest; no account or database server)

Everything is stored in one file on the computer running the server. Other devices on the same network can still use the app through that computer. This is the best choice for a team that self-hosts on one machine.

In `server/.env`:

```env
DB_CLIENT=sqlite
```

That's it. The database file (`server/db/frc-inventory.db` by default) and its table are created automatically the first time the server starts. To store it somewhere else, set `SQLITE_PATH` (relative to the `server/` folder, or an absolute path).

> **Tip:** If `server/.env` doesn't exist at all, the server also defaults to SQLite.

---

#### Option B — Self-hosted PostgreSQL (your own server or Docker)

Use this if you want a "real" database server you control, e.g. on a school server or NAS.

**Step 1 — Run Postgres.** The quickest way is Docker:

```bash
docker run -d --name spare-pit-db --restart unless-stopped \
  -e POSTGRES_USER=spare_pit -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=spare_pit \
  -p 5432:5432 -v spare-pit-data:/var/lib/postgresql/data \
  postgres:16
```

Or install PostgreSQL directly from [postgresql.org/download](https://www.postgresql.org/download/) and create a database and user for the app.

**Step 2 — Configure the server.** In `server/.env`:

```env
DB_CLIENT=postgres
DATABASE_URL=postgresql://spare_pit:change-me@localhost:5432/spare_pit
```

SSL is turned off automatically for `localhost`. If your Postgres server is on a **different machine**, SSL is on by default; add `DATABASE_SSL=false` if that server doesn't support SSL.

**Step 3 — Initialize.**

```bash
npm install
npm run init-db
```

The inventory table is created automatically if it doesn't exist. A successful run prints `Postgres inventory table created.` (or `verified.` on later runs).

---

#### Option C — Supabase (hosted PostgreSQL)

All team members connect to the same cloud database. This is what the [Remote Deployment](#remote-deployment-online) guide uses.

**Step 1 — Create a Supabase project**

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Click **New project**, give it a name (e.g. `frc-inventory`), and wait for it to provision

**Step 2 — Get your connection string**

1. Go to **Settings → Database → Connection string**
2. Select the **Transaction pooler** tab
3. Copy the connection string. It looks like:
   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-<region>.pooler.supabase.com:6543/postgres
   ```

**Step 3 — Configure the server.** In `server/.env`:

```env
DB_CLIENT=postgres
DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

**Step 4 — Initialize**

```bash
npm install
npm run init-db
```

The inventory table is created automatically. If that fails (e.g. permissions), open **SQL Editor → New Query** in Supabase, paste the contents of [`server/db/supabase-schema.sql`](../server/db/supabase-schema.sql), click **Run**, and try again.

---

#### Optional — Load sample data

To fill an empty database with ~30 example tools, parts, and materials (works with any backend):

```bash
cd server
npm run seed-db
```

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



## Choosing a Database

The server picks its database backend from `server/.env` at startup and prints `Using database: sqlite` or `Using database: postgres`. Switching backends is just a config change; restart the server afterward.

| | SQLite | Self-hosted Postgres | Supabase |
|---|---|---|---|
| Setup | None | Install Postgres or run Docker | Free Supabase account |
| Internet required | No | No | Yes |
| Where data lives | One file on the server machine | Your Postgres server | Supabase cloud |
| Good for | One team, one host computer | Larger setups, existing DB servers | Online deployment (Render/Netlify) |
| Backups | Copy the `.db` file (with the server stopped) | `pg_dump` | Supabase dashboard |

> **Note:** Switching backends does **not** move your data. Each backend has its own separate inventory.

### Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `DB_CLIENT` | All | `sqlite` or `postgres`. If unset: `postgres` when `DATABASE_URL` is set, otherwise `sqlite`. |
| `SQLITE_PATH` | SQLite | Database file location, relative to `server/`. Default `db/frc-inventory.db`. |
| `DATABASE_URL` | Postgres | Connection string (self-hosted or Supabase Transaction Pooler). |
| `DATABASE_SSL` | Postgres | `true` / `false`. Default: off for `localhost`, on otherwise. |
| `CORS_ORIGIN` | All | URL of the frontend; defaults to `http://localhost:5173`. |
| `PORT` | All | Port the API listens on; defaults to `3000`. |

### How the switch works

| | SQLite | Postgres |
|---|---|---|
| Connection | `server/db/db.sqlite.js` | `server/db/db.js` |
| Init / reset | `server/db/initDb.sqlite.js`, `deleteDb.sqlite.js` | `server/db/initDb.js`, `deleteDb.js` |
| Model (queries) | `server/models/inventoryModel.sqlite.js`, `locationModel.sqlite.js` | `server/models/inventoryModel.supabase.js`, `locationModel.supabase.js` |

`server/db/config.js` reads the environment variables and picks the backend. `server/db/index.js`, `server/models/inventoryModel.js` and `server/models/locationModel.js` then load the matching files, so the rest of the code (services, controllers, scripts) imports from those entry points and never needs to know which database is active. If you add a new query, add it to **both** model files and export it from the matching entry point.

### DB Schema

The Supabase schema is in [`server/db/supabase-schema.sql`](../server/db/supabase-schema.sql). The SQLite schema is embedded in [`server/db/db.sqlite.js`](../server/db/db.sqlite.js).

Areas contain locations, and each item is stored at one location (or none):

- **Area names** are unique, ignoring case.
- **Location names** only have to be unique *within their area*, so the Machine Shop and the Back Room can each have a "Tool Cabinet A". Locations with no area (`areaId` null) are shown as "Unassigned" and count as one group for uniqueness.
- **Items** point at a location by `locationId` (null = no location). The API adds the location's name and its area's id and name to every item it returns (`location`, `areaId`, `area`), but only `locationId` is stored.

Older databases stored free-text `area` and `location` columns on each item. On startup, the server migrates them automatically: every distinct area becomes an area, every distinct (area, location) pair becomes a location, each item gets the matching `locationId`, and the old columns are dropped.

```mermaid
erDiagram
    AREAS ||--o{ LOCATIONS : contains
    LOCATIONS ||--o{ INVENTORY : holds
    AREAS {
        int    id
        string name
    }
    LOCATIONS {
        int    id
        string name
        int    areaId
    }
    INVENTORY {
        int    id
        string name
        string type
        int    locationId
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

**DB** (`db/`) opens and manages the database connection. `db/config.js` chooses SQLite or Postgres. See [How the switch works](#how-the-switch-works).

---

## API Reference

### Areas and locations

| Method & path | Body | Notes |
|---|---|---|
| `GET /api/locations` | — | `{ areas: [{ id, name }], locations: [{ id, name, areaId, itemCount }] }` |
| `POST /api/areas` | `{ name }` | 409 if the name is taken |
| `PATCH /api/areas/:id` | `{ name }` | Rename |
| `DELETE /api/areas/:id` | — | Its locations become unassigned. 409 if one of them has the same name as an existing unassigned location |
| `POST /api/locations` | `{ name, areaId }` | `areaId` null = unassigned. 409 if the area already has that name |
| `PATCH /api/locations/:id` | `{ name?, areaId? }` | Rename and/or move. 409 if the destination area already has that name |
| `DELETE /api/locations/:id` | — | 409 while any item is stored there |

Items are given a location with `locationId` on `POST /api/inventory` and `PATCH /api/inventory/:id`; an unknown id returns 400. The add-item and edit forms create a new location first (`POST /api/locations`) when the typed name isn't in the chosen area yet.

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

```bash
cd server
npm run reset-db
```

This works with whichever backend `server/.env` selects. With **Postgres** it clears all rows from the inventory table; with **SQLite** it deletes and recreates the database file. Stop the server first when using SQLite.

### Server won't start

The first line of server output says which database it's using (`Using database: ...`). If it's not the one you expect, check `DB_CLIENT` in `server/.env`.

| Error | Fix |
|---|---|
| `DB_CLIENT is "postgres" but DATABASE_URL is not set` | Set `DATABASE_URL`, or set `DB_CLIENT=sqlite`. |
| `The server does not support SSL connections` | Add `DATABASE_SSL=false` to `server/.env`. |
| `Postgres inventory table is unavailable` | Check that `DATABASE_URL` is correct and the Postgres server is running. If the user can't create tables, run `server/db/supabase-schema.sql` by hand. |
| `Invalid DB_CLIENT` | Use exactly `sqlite` or `postgres`. |
