import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePage from './HomePage'

vi.mock('../utils/useInventory')
import { useInventory } from '../utils/useInventory'

vi.mock('../lib/api', () => ({
  patchInventory: vi.fn(),
}))
import { patchInventory } from '../lib/api'

const baseItem = {
  id: 1,
  name: 'Cordless Drill',
  type: 'tool',
  location: 'Tool Cabinet A',
  status: 'available',
  quantity: 2,
  needsRestock: 0,
}

const mockUpdateItem = vi.fn()

// Helper so every test gets a consistent mock return shape.
function mockInventory(data, loading = false) {
  useInventory.mockReturnValue({ data, loading, updateItem: mockUpdateItem })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

describe('HomePage — stat cards', () => {
  it('shows — for all stats while loading', () => {
    mockInventory([], true)
    render(<HomePage />)

    expect(screen.getAllByText('—')).toHaveLength(4)
  })

  it('shows the correct total item count', () => {
    mockInventory([baseItem, { ...baseItem, id: 2 }])
    render(<HomePage />)

    expect(screen.getByText('Total items')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows the correct needs-restock count', () => {
    mockInventory([
      { ...baseItem, id: 1, needsRestock: 1 },
      { ...baseItem, id: 2, needsRestock: 0 },
      { ...baseItem, id: 3, needsRestock: 1 },
    ])
    render(<HomePage />)

    // "Needs restock" appears in both the stat label and section heading — use getAllByText.
    expect(screen.getAllByText('Needs restock').length).toBeGreaterThanOrEqual(1)
    // The stat card for restock shows "2" (2 of the 3 items are flagged).
    const statCard = screen.getByText('Needs restock', { selector: '.stat__label' })
    expect(statCard.previousSibling.textContent).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// Needs restock list
// ---------------------------------------------------------------------------

describe('HomePage — Needs restock section', () => {
  it('shows the empty state message when no items are flagged', () => {
    mockInventory([{ ...baseItem, needsRestock: 0 }])
    render(<HomePage />)

    expect(screen.getByText('No items are flagged for restock.')).toBeInTheDocument()
  })

  it('renders each flagged item with its name', () => {
    mockInventory([
      { ...baseItem, id: 1, name: 'Cordless Drill', needsRestock: 1 },
      { ...baseItem, id: 2, name: 'Impact Driver', needsRestock: 1 },
      { ...baseItem, id: 3, name: 'Multimeter', needsRestock: 0 },
    ])
    render(<HomePage />)

    expect(screen.getAllByText('Cordless Drill').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Impact Driver').length).toBeGreaterThanOrEqual(1)
    // Unflagged item must not appear.
    expect(screen.queryByText('Multimeter')).not.toBeInTheDocument()
  })

  it('renders the quantity for flagged items', () => {
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: 2 }])
    render(<HomePage />)

    expect(screen.getByText('Qty: 2')).toBeInTheDocument()
  })

  it('renders the location for flagged items', () => {
    mockInventory([{ ...baseItem, needsRestock: 1, location: 'Tool Cabinet A' }])
    render(<HomePage />)

    expect(screen.getByText('Tool Cabinet A')).toBeInTheDocument()
  })

  it('does not render a quantity when it is null', () => {
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: null }])
    render(<HomePage />)

    expect(screen.queryByText(/qty:/i)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Needs restock — dashboard toggle
// ---------------------------------------------------------------------------

describe('HomePage — restock inline form', () => {
  it('renders a "Mark as restocked" button for each flagged item', () => {
    mockInventory([
      { ...baseItem, id: 1, name: 'Cordless Drill', needsRestock: 1 },
      { ...baseItem, id: 2, name: 'Impact Driver', needsRestock: 1 },
    ])
    render(<HomePage />)

    expect(screen.getAllByRole('button', { name: 'Mark as restocked' })).toHaveLength(2)
  })

  it('clicking "Mark as restocked" shows a quantity input pre-filled with the current quantity', async () => {
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: 5 }])
    render(<HomePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark as restocked' }))

    expect(screen.getByRole('spinbutton')).toHaveValue(5)
  })

  it('clicking Cancel hides the form without calling patchInventory', async () => {
    mockInventory([{ ...baseItem, needsRestock: 1 }])
    render(<HomePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark as restocked' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Mark as restocked' })).toBeInTheDocument()
    expect(patchInventory).not.toHaveBeenCalled()
  })

  it('clicking Save calls patchInventory with needsRestock: 0 and the current quantity', async () => {
    const clearedItem = { ...baseItem, needsRestock: 0, quantity: 2 }
    patchInventory.mockResolvedValueOnce(clearedItem)
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: 2 }])
    render(<HomePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark as restocked' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(patchInventory).toHaveBeenCalledWith(baseItem.id, { needsRestock: 0, quantity: 2 })
    )
  })

  it('clicking Save with a changed quantity sends the new value', async () => {
    const clearedItem = { ...baseItem, needsRestock: 0, quantity: 10 }
    patchInventory.mockResolvedValueOnce(clearedItem)
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: 2 }])
    render(<HomePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark as restocked' }))
    await userEvent.clear(screen.getByRole('spinbutton'))
    await userEvent.type(screen.getByRole('spinbutton'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(patchInventory).toHaveBeenCalledWith(baseItem.id, { needsRestock: 0, quantity: 10 })
    )
  })

  it('clicking Save calls updateItem with the server response', async () => {
    const clearedItem = { ...baseItem, needsRestock: 0, quantity: 2 }
    patchInventory.mockResolvedValueOnce(clearedItem)
    mockInventory([{ ...baseItem, needsRestock: 1, quantity: 2 }])
    render(<HomePage />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark as restocked' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledWith(clearedItem))
  })
})
