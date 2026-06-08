import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import InventoryPage from './InventoryPage'

// Mock the hook so tests never hit a real server
vi.mock('../../utils/useInventory')
import { useInventory } from '../../utils/useInventory'

const MOCK_TOOLS = [
  { id: 1, name: 'Torque Wrench', type: 'hand', location: 'Bay 1', status: 'available', tags: 'motor, battery' },
  { id: 2, name: 'Impact Driver', type: 'power', location: 'Bay 2', status: 'missing', tags: 'power' },
]

function mockInventoryHook() {
  useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
}

// Helper that stubs fetch to return a tag list
function stubFetchTags(tags) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(tags),
  }))
}

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

describe('InventoryPage — tag filter', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('renders the "Filter by tags" button', () => {
    useInventory.mockReturnValue({ data: MOCK_TOOLS, loading: false, error: null })
    render(<InventoryPage />)
    expect(screen.getByRole('button', { name: /filter by tags/i })).toBeInTheDocument()
  })

  it('opens the dropdown and shows tag chips when the button is clicked', async () => {
    mockInventoryHook()
    stubFetchTags(['battery', 'motor', 'power'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'battery' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'motor' })).toBeInTheDocument()
    })
  })

  it('closes the dropdown when the button is clicked a second time', async () => {
    mockInventoryHook()
    stubFetchTags(['motor'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'motor' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    expect(screen.queryByRole('button', { name: 'motor' })).not.toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside it', async () => {
    mockInventoryHook()
    stubFetchTags(['motor'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'motor' })).toBeInTheDocument())

    await user.click(document.body)
    expect(screen.queryByRole('button', { name: 'motor' })).not.toBeInTheDocument()
  })

  it('shows active filter count on the button when a tag is selected', async () => {
    mockInventoryHook()
    stubFetchTags(['battery', 'motor'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'battery' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'battery' }))
    expect(screen.getByRole('button', { name: /filter by tags \(1\)/i })).toBeInTheDocument()
  })

  it('selecting a second tag increments the count to 2', async () => {
    mockInventoryHook()
    stubFetchTags(['battery', 'motor'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'battery' })).toBeInTheDocument())

    // Select both chips while the dropdown is still open
    await user.click(screen.getByRole('button', { name: 'battery' }))
    await user.click(screen.getByRole('button', { name: 'motor' }))
    expect(screen.getByRole('button', { name: /filter by tags \(2\)/i })).toBeInTheDocument()
  })

  it('filters the table to only items matching the selected tag', async () => {
    mockInventoryHook()
    stubFetchTags(['motor', 'power'])
    const user = userEvent.setup()
    render(<InventoryPage />)

    await user.click(screen.getByRole('button', { name: /filter by tags/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'power' })).toBeInTheDocument())

    // "power" tag only belongs to item 2 (Impact Driver)
    await user.click(screen.getByRole('button', { name: 'power' }))
    expect(screen.queryByText('Torque Wrench')).not.toBeInTheDocument()
    expect(screen.getByText('Impact Driver')).toBeInTheDocument()
  })
})