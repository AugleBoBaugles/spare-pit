import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInventory } from './useInventory'

// Mock the api module — we test the hook's behavior, not the fetch itself
vi.mock('../lib/api')
import { fetchInventory } from '../lib/api'

const MOCK_TOOLS = [
  { id: 1, name: 'Torque Wrench', type: 'hand', location: 'Bay 1', status: 'in' },
  { id: 2, name: 'Impact Driver', type: 'power', location: 'Bay 2', status: 'out' },
]

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in a loading state with no data or error', () => {
    // Never resolves — lets us inspect the initial state before the fetch completes
    fetchInventory.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useInventory())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns data and clears loading on success', async () => {
    fetchInventory.mockResolvedValue(MOCK_TOOLS)

    const { result } = renderHook(() => useInventory())

    // Wait for the hook to finish the async work and re-render
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(MOCK_TOOLS)
    expect(result.current.error).toBeNull()
  })

  it('returns an error and clears loading on failure', async () => {
    const mockError = new Error('Failed to fetch')
    fetchInventory.mockRejectedValue(mockError)

    const { result } = renderHook(() => useInventory())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(mockError)
    expect(result.current.data).toEqual([])
  })

  it('calls fetchInventory exactly once on mount', async () => {
    fetchInventory.mockResolvedValue(MOCK_TOOLS)

    renderHook(() => useInventory())

    await waitFor(() => expect(fetchInventory).toHaveBeenCalledTimes(1))
  })
})