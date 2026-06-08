# Spare Pit

Spare Pit is an inventory management app built for FIRST Robotics Competition (FRC) teams. It gives students a shared, real-time way to track tools, parts, and materials — what's available, who has what, and what needs to be ordered.

Built by [Augy Markham](https://www.linkedin.com/in/augy-markham/) and [Rebecca Riffle](https://www.linkedin.com/in/rebecca-riffle/) at Green River College.

**Features**
- Browse and search inventory by name, type, location, or status
- Expand any item to view full details: area, quantity, condition, tags, and notes
- Edit items inline directly from the inventory list
- Filter by one or more tags to find items by category
- Flag items that need restocking and manage orders from the Dashboard
- Delete items with a typed confirmation step to prevent accidents
- Light and dark mode

> **For developers:** See [docs/DEVELOPER.md](docs/DEVELOPER.md) to set up, run, and extend the app.

---

## User Guide

**Contents**
1. [Viewing and Editing Inventory](#viewing-and-editing-inventory)
1. [Filtering by Tags](#filtering-by-tags)
1. [Flagging Items as Needs Restock](#flagging-items-as-needs-restock)
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
| Available | In storage and ready to use |
| Checked out | Signed out by a subteam — see "Last Checked Out By" for who last had it |
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

### Filtering by Tags

Tags are short keywords attached to inventory items (e.g. `motor`, `battery`, `power`) that let you quickly narrow the list to a category of items.

#### Using the tag filter

1. On the inventory page, click the **Filter by tags** button to the right of the search bar.
2. A panel opens showing every tag currently in the database as clickable chips.
3. Click a chip to select it — the inventory table immediately updates to show only items that have that tag.
4. Click additional chips to tighten the filter. **All selected tags must be present** on an item for it to appear (AND logic). For example, selecting `motor` and `battery` shows only items tagged with both.
5. Click an active chip again to deselect it and widen the results.
6. Click outside the panel to close it.

When one or more tags are active the button label shows the count, e.g. **Filter by tags (2)**, so you can see what's active without reopening the panel.

The tag filter and the search bar work together — text search narrows results first, then the tag filter is applied on top.

#### Tag format when adding or editing items

Tags are stored as a comma-separated list in the **Tags** field, e.g. `motor, battery` or `power,drilling`. Rules:

- Each tag is a word or short phrase (letters, numbers, hyphens, spaces).
- Separate multiple tags with a comma.
- No empty segments — `motor,` or `motor,,battery` will be rejected with an inline error.
- Tags are case-insensitive when filtering (`Motor` and `motor` are treated as the same tag).

### Flagging Items as Needs Restock

Use this when you notice that an item is running low and needs to be ordered.

#### Flagging an item

1. Find the item in the inventory list and click its row to expand it.
2. At the bottom of the expanded panel, click the **Needs Restock** toggle. The switch slides right to show the item is flagged.
3. To clear the flag from the expanded panel, click the toggle again — the switch slides back left.

#### Ordering from the Dashboard

1. Go to the **Dashboard**. Flagged items appear in the **Needs restock** section, showing each item's name, quantity, and location.
2. When you have ordered an item, click **Mark as restocked** next to it.
3. A quantity field will appear, pre-filled with the current quantity. Update it to reflect how many are now in the inventory, then click **Save**.
4. The item is removed from the restock list and its quantity is updated.

> **Note:** The Needs Restock flag is independent of an item's status — you can flag any item regardless of whether it is available, checked out, or otherwise.

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

- Sun icon — Light mode
- Moon icon — Dark mode

Click the toggle once to switch modes. The preference is active for the current session.

### Troubleshooting

If the inventory isn't showing the data you expect, or an item isn't saving correctly, try refreshing the page. If the problem persists, contact your team admin.

**Team admins:** For database reset and other maintenance operations, see the [Developer Guide](docs/DEVELOPER.md#troubleshooting).
