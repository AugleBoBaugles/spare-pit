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

### Initialize Inventory Database
```
npm run init-db
```
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

### Dark Mode

Spare Pit supports light and dark mode so you can view the inventory comfortably in any environment.

A dark mode toggle sits in the **upper-right corner** of every page.

- Sun - Light Mode
- Moon - Dark Mode

Click the toggle once to switch modes. The preference is active for the current session.

### Troubleshooting
#### Reset Database
*Warning: This will delete ALL the contents of your database. Proceed with caution!*

`npm run reset-db`
## Developer Notes
### DB Schema
```mermaid
erDiagram
    INVENTORY 
    INVENTORY {
        string name
        string type
        string location
        string status
    }
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

**DB** (`db/db.js`) opens and manages the SQLite database connection.