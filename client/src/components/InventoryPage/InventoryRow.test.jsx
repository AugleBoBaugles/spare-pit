import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import InventoryRow from './InventoryRow';
import ExpandedPanel, { ITEM_FIELDS, FALLBACK } from './ExpandedPanel';
import { patchInventory, deleteInventory } from '../../lib/api';

// Replace real API calls with mocks so tests never hit the network.
vi.mock('../../lib/api', () => ({
  patchInventory: vi.fn(),
  deleteInventory: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// A fully-populated item that matches the shape returned by the real API.
const baseItem = {
  id: 1,
  name: 'Cordless Drill',
  type: 'tool',
  location: 'Tool Cabinet A',
  status: 'available',
  area: 'Machine Shop',
  quantity: 2,
  condition: 'good',
  checkOutBy: null,
  tags: 'power,drilling',
  notes: 'Includes 2 battery packs',
  itemImage: 'images/cordless-drill.jpg',
  needsRestock: 0,
};

// Same item but with all optional fields set to null, used to test the fallback display.
const nullFieldItem = {
  ...baseItem,
  id: 2,
  area: null,
  quantity: null,
  condition: null,
  checkOutBy: null,
  tags: null,
  notes: null,
  itemImage: null,
};

beforeEach(() => {
  // Reset call history between tests so one test's calls don't affect another's assertions.
  patchInventory.mockReset();
  deleteInventory.mockReset();
  // ExpandedPanel fetches subteams on mount via useSubteams(). We mock the global fetch
  // here to return an empty array so tests don't fail trying to reach a real server.
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

// InventoryRow must live inside a <table><tbody> or the browser warns about invalid HTML.
function renderRow(props) {
  return render(
    <table>
      <tbody>
        {/* Default callbacks to no-ops so tests that don't care about them don't have to pass them. */}
        <InventoryRow onItemUpdate={vi.fn()} onDelete={vi.fn()} {...props} />
      </tbody>
    </table>
  );
}

// ExpandedPanel also needs a valid table wrapper, plus sensible prop defaults.
function renderPanel(props) {
  return render(
    <table>
      <tbody>
        <ExpandedPanel
          item={baseItem}
          isEditing={false}
          onEditingChange={vi.fn()}
          onItemUpdate={vi.fn()}
          {...props}
        />
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Accordion behaviour
// ---------------------------------------------------------------------------

describe('InventoryRow — accordion behaviour', () => {
  it('does not show the expanded panel when isOpen is false', () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    expect(screen.queryByText('Area')).not.toBeInTheDocument();
  });

  it('shows the expanded panel when isOpen is true', () => {
    renderRow({ item: baseItem, isOpen: true, onToggle: vi.fn() });

    expect(screen.getByText('Area')).toBeInTheDocument();
  });

  it('calls onToggle when the row is clicked', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    // The <tr> has role="button" and its accessible name is computed from its text content,
    // which includes the item name. This selector targets the row, not the three-dot button.
    await userEvent.click(screen.getByRole('button', { name: /cordless drill/i }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onToggle again when an already-open row is clicked (collapse)', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: true, onToggle });

    await userEvent.click(screen.getByRole('button', { name: /cordless drill/i }));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// One-open-at-a-time — tested at the InventoryPage level via onToggle logic
// ---------------------------------------------------------------------------

describe('InventoryPage — one row open at a time', () => {
  it('passes isOpen=true to only the expanded row', () => {
    const items = [
      { ...baseItem, id: 1, name: 'Item A' },
      { ...baseItem, id: 2, name: 'Item B' },
    ];

    // Simulate the expandedId logic from InventoryPage.
    const expandedId = 1;

    render(
      <table>
        <tbody>
          {items.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              isOpen={expandedId === item.id}
              onToggle={vi.fn()}
              onItemUpdate={vi.fn()}
            />
          ))}
        </tbody>
      </table>
    );

    // 'Area' label only appears once — inside Item A's expanded panel.
    expect(screen.getAllByText('Area')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// ExpandedPanel — field rendering
// ---------------------------------------------------------------------------

describe('ExpandedPanel — field rendering', () => {
  it('renders a label and value for every field in ITEM_FIELDS', () => {
    renderPanel({ item: baseItem });

    for (const { label } of ITEM_FIELDS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders the correct value for each populated field', () => {
    renderPanel({ item: baseItem });

    expect(screen.getByText('Machine Shop')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
    expect(screen.getByText('power,drilling')).toBeInTheDocument();
    expect(screen.getByText('Includes 2 battery packs')).toBeInTheDocument();
    expect(screen.getByText('images/cordless-drill.jpg')).toBeInTheDocument();
  });

  it(`shows "${FALLBACK}" for every null or missing field`, () => {
    renderPanel({ item: nullFieldItem });

    const fallbacks = screen.getAllByText(FALLBACK);
    // Count how many fields in nullFieldItem are null so we know exactly how many fallbacks to expect.
    const nullCount = ITEM_FIELDS.filter(({ key }) => nullFieldItem[key] == null).length;
    expect(fallbacks).toHaveLength(nullCount);
  });

  it('shows "Last Checked Out By" label for an item with status "available"', () => {
    renderPanel({ item: { ...baseItem, status: 'available' } });

    expect(screen.getByText('Last Checked Out By')).toBeInTheDocument();
  });

  it('shows "Last Checked Out By" label for items with maintenance and missing status', () => {
    const { rerender } = renderPanel({ item: { ...baseItem, status: 'maintenance' } });
    expect(screen.getByText('Last Checked Out By')).toBeInTheDocument();

    rerender(
      <table><tbody>
        <ExpandedPanel item={{ ...baseItem, status: 'missing' }} isEditing={false} onEditingChange={vi.fn()} onItemUpdate={vi.fn()} />
      </tbody></table>
    );
    expect(screen.getByText('Last Checked Out By')).toBeInTheDocument();
  });

  it('shows "Not specified" when checkOutBy is null', () => {
    renderPanel({ item: { ...baseItem, checkOutBy: null } });

    // The label is present and the value shows the fallback placeholder.
    expect(screen.getByText('Last Checked Out By')).toBeInTheDocument();
    // At least one "Not specified" appears for the null checkOutBy field.
    expect(screen.getAllByText(FALLBACK).length).toBeGreaterThan(0);
  });

  it('uses "Checked out by" (not "Last Checked Out By") as the edit-form label', () => {
    renderPanel({ item: { ...baseItem, status: 'checked-out' }, isEditing: true });

    expect(screen.getByLabelText('Checked out by')).toBeInTheDocument();
    expect(screen.queryByText('Last Checked Out By')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Three-dot actions menu
// ---------------------------------------------------------------------------

describe('InventoryRow — three-dot actions menu', () => {
  it('renders the three-dot button on a collapsed row', () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    // aria-label="Row actions" is what distinguishes the ⋯ button from the row toggle.
    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
  });

  it('renders the three-dot button on an expanded row', () => {
    renderRow({ item: baseItem, isOpen: true, onToggle: vi.fn() });

    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
  });

  it('clicking the three-dot button does not call onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    // stopPropagation on the actions cell prevents the click from reaching the row's onClick.
    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking the three-dot button opens a dropdown with an Edit option', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));

    // role="menuitem" is set on the Edit button inside the dropdown.
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('clicking outside the open dropdown closes it without entering edit mode', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Clicking document.body fires a mousedown outside the menu ref, which closes it.
    await userEvent.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking Edit on a collapsed row calls onToggle to expand it', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    // handleEditClick calls onToggle when the row is closed so the panel becomes visible.
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('clicking Edit on an already-expanded row does not call onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: true, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    // Row is already open, so onToggle must NOT fire (that would collapse it).
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking Edit on an expanded row opens the panel in edit mode', async () => {
    renderRow({ item: baseItem, isOpen: true, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    // The Save button only exists in edit mode, so finding it confirms we're there.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ExpandedPanel — edit mode
// ---------------------------------------------------------------------------

describe('ExpandedPanel — edit mode', () => {
  it('Cancel exits edit mode without calling the API', async () => {
    const onEditingChange = vi.fn();
    renderPanel({ isEditing: true, onEditingChange });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // onEditingChange(false) tells InventoryRow to set isEditing back to false.
    expect(onEditingChange).toHaveBeenCalledWith(false);
    // No PATCH should have been sent — cancel means discard, not save.
    expect(patchInventory).not.toHaveBeenCalled();
  });

  it('Save with valid data calls patchInventory and exits edit mode', async () => {
    const onEditingChange = vi.fn();
    const onItemUpdate = vi.fn();
    const updatedItem = { ...baseItem, status: 'checked-out' };
    // Tell the mock what to return when patchInventory is called.
    patchInventory.mockResolvedValueOnce(updatedItem);

    renderPanel({ isEditing: true, onEditingChange, onItemUpdate });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // waitFor handles the async gap between clicking Save and the promise resolving.
    await waitFor(() => expect(onEditingChange).toHaveBeenCalledWith(false));
    expect(patchInventory).toHaveBeenCalledWith(baseItem.id, expect.objectContaining({ name: baseItem.name }));
    // onItemUpdate swaps the old item in the list with the server's response.
    expect(onItemUpdate).toHaveBeenCalledWith(updatedItem);
  });

  it('Save with an empty required field shows a validation error and does not submit', async () => {
    // Start with a blank name so the "name" required check will fail.
    renderPanel({ item: { ...baseItem, name: '' }, isEditing: true });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // The inline "Required" message should appear next to the invalid field.
    expect(screen.getByText('Required')).toBeInTheDocument();
    // validate() returned false, so patchInventory should never have been called.
    expect(patchInventory).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Delete action
// ---------------------------------------------------------------------------

describe('InventoryRow — delete action', () => {
  it('the dropdown renders a Delete option in a distinct warning color alongside Edit', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));

    const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
    expect(deleteBtn).toBeInTheDocument();
    // btn-delete applies the red warning colour defined in InventoryPage.css.
    expect(deleteBtn).toHaveClass('btn-delete');
  });

  it('clicking Delete opens the confirmation modal without calling onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    // The dialog is rendered via createPortal to document.body so it's still queryable via screen.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // handleDeleteClick must not call onToggle — that would accidentally expand/collapse the row.
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('Confirm button is disabled when the text input is empty', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    // No text typed yet — Confirm must be unreachable.
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('Confirm button is disabled when the input does not exactly match DELETE', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    // Lowercase "delete" must not satisfy the case-sensitive check.
    await userEvent.type(screen.getByRole('textbox'), 'delete');

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('Confirm button becomes enabled only when the input matches DELETE exactly', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    await userEvent.type(screen.getByRole('textbox'), 'DELETE');

    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });

  it('clicking Cancel closes the modal without calling deleteInventory', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Modal must be gone and no DELETE request should have been sent.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteInventory).not.toHaveBeenCalled();
  });

  it('Confirm with DELETE typed calls deleteInventory, removes the item, and closes the modal', async () => {
    const onDelete = vi.fn();
    deleteInventory.mockResolvedValueOnce({ message: 'Deleted' });
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn(), onDelete });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await userEvent.type(screen.getByRole('textbox'), 'DELETE');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    // waitFor handles the async gap while the delete promise resolves.
    await waitFor(() => expect(deleteInventory).toHaveBeenCalledWith(baseItem.id));
    // onDelete fires after the API succeeds so the parent can remove the item from state.
    expect(onDelete).toHaveBeenCalledWith(baseItem.id);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('on request failure the modal closes, onDelete is not called, and an error is shown', async () => {
    const onDelete = vi.fn();
    deleteInventory.mockRejectedValueOnce(new Error('Network error'));
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn(), onDelete });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await userEvent.type(screen.getByRole('textbox'), 'DELETE');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    // Modal closes even on failure so the user can see the item is still in the list.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // onDelete must not fire — the item should remain in the parent's state.
    expect(onDelete).not.toHaveBeenCalled();
    // The inline error row should now be visible below the affected item.
    expect(screen.getByText(/failed to delete/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ExpandedPanel — Needs Restock toggle
// ---------------------------------------------------------------------------

describe('ExpandedPanel — Needs Restock toggle', () => {
  it('renders a "Needs Restock" switch in read mode', () => {
    renderPanel({ item: { ...baseItem, needsRestock: 0 } });

    expect(screen.getByRole('switch', { name: 'Needs Restock' })).toBeInTheDocument();
  });

  it('switch is unchecked (aria-checked=false) when needsRestock is 0', () => {
    renderPanel({ item: { ...baseItem, needsRestock: 0 } });

    expect(screen.getByRole('switch', { name: 'Needs Restock' })).toHaveAttribute('aria-checked', 'false');
  });

  it('switch is checked (aria-checked=true) when needsRestock is 1', () => {
    renderPanel({ item: { ...baseItem, needsRestock: 1 } });

    expect(screen.getByRole('switch', { name: 'Needs Restock' })).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking the switch calls patchInventory with needsRestock: 1 when currently 0', async () => {
    const onItemUpdate = vi.fn();
    const updatedItem = { ...baseItem, needsRestock: 1 };
    patchInventory.mockResolvedValueOnce(updatedItem);

    renderPanel({ item: { ...baseItem, needsRestock: 0 }, onItemUpdate });

    await userEvent.click(screen.getByRole('switch', { name: 'Needs Restock' }));

    await waitFor(() => expect(patchInventory).toHaveBeenCalledWith(baseItem.id, { needsRestock: 1 }));
    expect(onItemUpdate).toHaveBeenCalledWith(updatedItem);
  });

  it('clicking the switch calls patchInventory with needsRestock: 0 when currently 1', async () => {
    const onItemUpdate = vi.fn();
    const updatedItem = { ...baseItem, needsRestock: 0 };
    patchInventory.mockResolvedValueOnce(updatedItem);

    renderPanel({ item: { ...baseItem, needsRestock: 1 }, onItemUpdate });

    await userEvent.click(screen.getByRole('switch', { name: 'Needs Restock' }));

    await waitFor(() => expect(patchInventory).toHaveBeenCalledWith(baseItem.id, { needsRestock: 0 }));
    expect(onItemUpdate).toHaveBeenCalledWith(updatedItem);
  });

  it('shows an error message when the PATCH fails', async () => {
    patchInventory.mockRejectedValueOnce(new Error('Network error'));

    renderPanel({ item: { ...baseItem, needsRestock: 0 } });

    await userEvent.click(screen.getByRole('switch', { name: 'Needs Restock' }));

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });
});
