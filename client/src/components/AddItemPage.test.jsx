import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AddItemPage from './AddItemPage'

function makeFetch(data, { ok = true } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  })
}

async function fillRequired(user) {
  await user.type(screen.getByLabelText(/item name/i), 'Cordless Drill')
  await user.selectOptions(screen.getByLabelText(/^type/i), 'tool')
  await user.type(screen.getByLabelText(/location/i), 'Bay 1')
  // status defaults to "available", quantity defaults to 1
}

describe('AddItemPage', () => {
  let onNavigate

  beforeEach(() => {
    onNavigate = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders the form with a submit button', () => {
    render(<AddItemPage onNavigate={onNavigate} />)
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })

  it('shows validation errors for all required fields when submitted empty', async () => {
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/type is required/i)).toBeInTheDocument()
    expect(screen.getByText(/location is required/i)).toBeInTheDocument()
  })

  it('clears a field error once the user starts typing in that field', async () => {
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/item name/i), 'Drill')
    expect(screen.queryByText(/item name is required/i)).not.toBeInTheDocument()
  })

  it('navigates to inventory immediately on a clean successful submit', async () => {
    vi.stubGlobal('fetch', makeFetch({ id: 1, possibleDuplicate: null }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('inventory'))
  })

  it('shows the duplicate warning banner when possibleDuplicate is returned', async () => {
    vi.stubGlobal('fetch', makeFetch({ id: 2, possibleDuplicate: { id: 1, name: 'Cordless Drill' } }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('schedules a redirect after 2.5 seconds when a duplicate is detected', async () => {
    // Spy wraps setTimeout without replacing it so real timers still work for userEvent
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    vi.stubGlobal('fetch', makeFetch({ id: 2, possibleDuplicate: { id: 1, name: 'Cordless Drill' } }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2500)
  })

  it('shows a submit error banner when the API returns a non-ok response', async () => {
    vi.stubGlobal('fetch', makeFetch({ error: 'Name already taken.' }, { ok: false }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/name already taken/i)
  })

  it('shows a network error banner when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
  })

  it('shows the "checked out by" field only when status is set to checked-out', async () => {
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    expect(screen.queryByLabelText(/checked out by/i)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/^status/i), 'checked-out')
    expect(screen.getByLabelText(/checked out by/i)).toBeInTheDocument()
  })

  it('calls onNavigate("inventory") when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onNavigate).toHaveBeenCalledWith('inventory')
  })

  it('fetches subteams from the API on mount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['electrical', 'mechanical']),
    }))
    render(<AddItemPage onNavigate={onNavigate} />)
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/inventory/subteams'))
  })

  it('populates the datalist with fetched subteams', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['electrical', 'mechanical', 'programming']),
    }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await user.selectOptions(screen.getByLabelText(/^status/i), 'checked-out')
    await waitFor(() => {
      expect(document.getElementById('subteam-options').options).toHaveLength(3)
    })
  })

  it('allows typing a custom subteam value not in the list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['electrical']),
    }))
    const user = userEvent.setup()
    render(<AddItemPage onNavigate={onNavigate} />)
    await user.selectOptions(screen.getByLabelText(/^status/i), 'checked-out')
    const input = screen.getByLabelText(/checked out by/i)
    await user.type(input, 'robotics')
    expect(input).toHaveValue('robotics')
  })

  it('still renders the form when the subteams fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<AddItemPage onNavigate={onNavigate} />)
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })
})
