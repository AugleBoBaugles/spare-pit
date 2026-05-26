import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import InventoryRow from './InventoryRow';
import ExpandedPanel, { ITEM_FIELDS, FALLBACK } from './ExpandedPanel';
import { patchInventory } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  patchInventory: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

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
};

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
  patchInventory.mockReset();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

// Helper — renders a single InventoryRow inside a valid table structure.
function renderRow(props) {
  return render(
    <table>
      <tbody>
        <InventoryRow onItemUpdate={vi.fn()} {...props} />
      </tbody>
    </table>
  );
}

// Helper — renders ExpandedPanel directly inside a valid table structure.
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
    const nullCount = ITEM_FIELDS.filter(({ key }) => nullFieldItem[key] == null).length;
    expect(fallbacks).toHaveLength(nullCount);
  });
});

// ---------------------------------------------------------------------------
// Three-dot actions menu
// ---------------------------------------------------------------------------

describe('InventoryRow — three-dot actions menu', () => {
  it('renders the three-dot button on a collapsed row', () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
  });

  it('renders the three-dot button on an expanded row', () => {
    renderRow({ item: baseItem, isOpen: true, onToggle: vi.fn() });

    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
  });

  it('clicking the three-dot button does not call onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking the three-dot button opens a dropdown with an Edit option', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));

    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('clicking outside the open dropdown closes it without entering edit mode', async () => {
    renderRow({ item: baseItem, isOpen: false, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking Edit on a collapsed row calls onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: false, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('clicking Edit on an already-expanded row does not call onToggle', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: true, onToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking Edit on an expanded row opens the panel in edit mode', async () => {
    renderRow({ item: baseItem, isOpen: true, onToggle: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

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

    expect(onEditingChange).toHaveBeenCalledWith(false);
    expect(patchInventory).not.toHaveBeenCalled();
  });

  it('Save with valid data calls patchInventory and exits edit mode', async () => {
    const onEditingChange = vi.fn();
    const onItemUpdate = vi.fn();
    const updatedItem = { ...baseItem, status: 'checked-out' };
    patchInventory.mockResolvedValueOnce(updatedItem);

    renderPanel({ isEditing: true, onEditingChange, onItemUpdate });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onEditingChange).toHaveBeenCalledWith(false));
    expect(patchInventory).toHaveBeenCalledWith(baseItem.id, expect.objectContaining({ name: baseItem.name }));
    expect(onItemUpdate).toHaveBeenCalledWith(updatedItem);
  });

  it('Save with an empty required field shows a validation error and does not submit', async () => {
    renderPanel({ item: { ...baseItem, name: '' }, isEditing: true });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(patchInventory).not.toHaveBeenCalled();
  });
});
