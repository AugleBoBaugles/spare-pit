import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import InventoryPage from '../components/InventoryPage'

// Mock the hook so tests never hit a real server
vi.mock('../utils/useInventory')
import { useInventory } from '../utils/useInventory'

const MOCK_TOOLS = [
  { id: 1, name: 'Torque Wrench', type: 'hand', location: 'Bay 1', status: 'in' },
  { id: 2, name: 'Impact Driver', type: 'power', location: 'Bay 2', status: 'out' },
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

    const inPill = screen.getByText('in')
    const outPill = screen.getByText('out')
    expect(inPill).toHaveClass('status-in')
    expect(outPill).toHaveClass('status-out')
  })

  it('renders column headers', () => {
    useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
    render(<InventoryPage />)

    for (const header of ['Name', 'Type', 'Location', 'Status']) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }
  })

  it('shows empty table body when data is empty', () => {
    useInventory.mockReturnValue({ data: [], loading: false, error: null })
    render(<InventoryPage />)
    // Table should render but tbody has no rows
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryAllByRole('row').length).toBe(1) // only the header row
  })
})