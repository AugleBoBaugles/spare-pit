import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import InventoryRow from './InventoryRow';
import ExpandedPanel, { ITEM_FIELDS, FALLBACK } from './ExpandedPanel';

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

// Helper — renders a single InventoryRow inside a valid table structure.
function renderRow(props) {
  return render(
    <table>
      <tbody>
        <InventoryRow {...props} />
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

    await userEvent.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onToggle again when an already-open row is clicked (collapse)', async () => {
    const onToggle = vi.fn();
    renderRow({ item: baseItem, isOpen: true, onToggle });

    await userEvent.click(screen.getByRole('button'));

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

    const { getAllByRole } = render(
      <table>
        <tbody>
          {items.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              isOpen={expandedId === item.id}
              onToggle={vi.fn()}
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
    render(
      <table>
        <tbody>
          <ExpandedPanel item={baseItem} />
        </tbody>
      </table>
    );

    for (const { label } of ITEM_FIELDS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders the correct value for each populated field', () => {
    render(
      <table>
        <tbody>
          <ExpandedPanel item={baseItem} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Machine Shop')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
    expect(screen.getByText('power,drilling')).toBeInTheDocument();
    expect(screen.getByText('Includes 2 battery packs')).toBeInTheDocument();
    expect(screen.getByText('images/cordless-drill.jpg')).toBeInTheDocument();
  });

  it(`shows "${FALLBACK}" for every null or missing field`, () => {
    render(
      <table>
        <tbody>
          <ExpandedPanel item={nullFieldItem} />
        </tbody>
      </table>
    );

    const fallbacks = screen.getAllByText(FALLBACK);

    // Every field in nullFieldItem is null, so every field should show the fallback.
    const nullCount = ITEM_FIELDS.filter(({ key }) => nullFieldItem[key] == null).length;
    expect(fallbacks).toHaveLength(nullCount);
  });
});