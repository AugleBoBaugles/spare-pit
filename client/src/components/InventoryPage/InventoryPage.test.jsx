import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import InventoryPage from './InventoryPage'

// Mock the hook so tests never hit a real server
vi.mock('../../utils/useInventory')
import { useInventory } from '../../utils/useInventory'

const MOCK_TOOLS = [
  { id: 1, name: 'Torque Wrench', type: 'hand', location: 'Bay 1', status: 'available' },
  { id: 2, name: 'Impact Driver', type: 'power', location: 'Bay 2', status: 'missing' },
]

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state initially', () => {
    useInventory.mockReturnValue({ data: [], loading: true, error: null })
    render(<InventoryPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', () => {
    useInventory.mockReturnValue({
      data: [],
      loading: false,
      error: new Error('Network Error'),
    })
    render(<InventoryPage />)
    expect(screen.getByText(/error/i)).toBeInTheDocument()
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('renders a row for each tool after loading', () => {
    useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
    render(<InventoryPage />)

    expect(screen.getByText('Torque Wrench')).toBeInTheDocument()
    expect(screen.getByText('Impact Driver')).toBeInTheDocument()
  })

  it('renders the correct status pill for each tool', () => {
    useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
    render(<InventoryPage />)

    const availablePill = screen.getByText('available')
    const missingPill = screen.getByText('missing')
    expect(availablePill).toHaveClass('status-available')
    expect(missingPill).toHaveClass('status-missing')
  })

  it('renders column headers', () => {
    useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
    render(<InventoryPage />)

    for (const header of ['Name', 'Type', 'Location', 'Status']) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }
  })

  it('shows an empty database message when data is empty', () => {
    useInventory.mockReturnValue({ data: [], loading: false, error: null })
    render(<InventoryPage />)

    expect(screen.getByText('The inventory database is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})