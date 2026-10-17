import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AddItemRow from './AddItemRow'

// Returns a fetch stub that handles the two on-mount setup calls (subteams + tags)
// with empty arrays, and uses `data`/`ok` for any other request (e.g. the POST).
function makeFetch(data, { ok = true } = {}) {
  return vi.fn().mockImplementation((url) => {
    if (url === '/api/inventory/subteams' || url === '/api/inventory/tags') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    return Promise.resolve({ ok, json: () => Promise.resolve(data) });
  });
}

// Typing into the collapsed row is what opens the full form.
async function startAdding(user, name = 'Cordless Drill') {
  await user.type(screen.getByLabelText(/item name/i), name)
}

async function fillRequired(user) {
  await startAdding(user)
  await user.selectOptions(screen.getByLabelText(/^type/i), 'tool')
  await user.type(screen.getByLabelText(/^location/i), 'Bay 1')
  // status defaults to "available", quantity defaults to 1
}

function postCalls() {
  return fetch.mock.calls.filter(([, opts]) => opts?.method === 'POST')
}

describe('AddItemRow', () => {
  let onItemAdded

  beforeEach(() => {
    onItemAdded = vi.fn()
    vi.stubGlobal('fetch', makeFetch({ id: 1, name: 'Cordless Drill', possibleDuplicate: null }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts collapsed, showing only the "Add item" field', () => {
    render(<AddItemRow onItemAdded={onItemAdded} />)
    expect(screen.getByPlaceholderText(/add item/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^type/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument()
  })

  it('expands to show all fields once the user starts typing', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user, 'D')
    for (const label of [/^type/i, /^location/i, /^quantity/i, /^status/i, /^area/i, /^condition/i, /^tags/i, /^notes/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    // Focus stays in the name field so typing isn't interrupted.
    expect(screen.getByLabelText(/item name/i)).toHaveFocus()
    expect(screen.getByLabelText(/item name/i)).toHaveValue('D')
  })

  it('collapses again when the name is erased, keeping the other fields', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user, 'Dr')
    await user.type(screen.getByLabelText(/^location/i), 'Bay 1')

    await user.clear(screen.getByLabelText(/item name/i))
    expect(screen.queryByLabelText(/^type/i)).not.toBeInTheDocument()

    await startAdding(user, 'D')
    expect(screen.getByLabelText(/^location/i)).toHaveValue('Bay 1')
  })

  it('lists required fields before optional ones', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    const labels = screen.getAllByText(/./, { selector: 'label' }).map(l => l.textContent)
    const lastRequired = Math.max(...labels.map((l, i) => (l.endsWith('*') ? i : -1)))
    const firstOptional = labels.findIndex(l => !l.endsWith('*'))
    expect(lastRequired).toBeLessThan(firstOptional)
  })

  it('shows validation errors for missing required fields', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/type is required/i)).toBeInTheDocument()
    expect(screen.getByText(/location is required/i)).toBeInTheDocument()
    expect(postCalls()).toHaveLength(0)
  })

  it('clears a field error once the user changes that field', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/location is required/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^location/i), 'Bay 1')
    expect(screen.queryByText(/location is required/i)).not.toBeInTheDocument()
  })

  it('creates the item, collapses, and refocuses the name field', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => expect(onItemAdded).toHaveBeenCalledWith({ id: 1, name: 'Cordless Drill' }))
    expect(screen.getByRole('status')).toHaveTextContent(/added “cordless drill”/i)
    expect(screen.queryByLabelText(/^type/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/item name/i)).toHaveValue('')
    expect(screen.getByLabelText(/item name/i)).toHaveFocus()
  })

  it('submits when Enter is pressed in a field', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.keyboard('{Enter}')
    await waitFor(() => expect(onItemAdded).toHaveBeenCalled())
  })

  it('carries type and location over to the next item', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(onItemAdded).toHaveBeenCalled())

    await startAdding(user, 'Hex Keys')
    expect(screen.getByLabelText(/^type/i)).toHaveValue('tool')
    expect(screen.getByLabelText(/^location/i)).toHaveValue('Bay 1')
    expect(screen.getByLabelText(/^notes/i)).toHaveValue('')
  })

  it('shows a duplicate warning when possibleDuplicate is returned', async () => {
    vi.stubGlobal('fetch', makeFetch({ id: 2, name: 'Cordless Drill', possibleDuplicate: { id: 1 } }))
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/already existed/i))
    expect(onItemAdded).toHaveBeenCalledWith({ id: 2, name: 'Cordless Drill' })
  })

  it('shows a submit error banner when the API returns a non-ok response', async () => {
    vi.stubGlobal('fetch', makeFetch({ error: 'Name already taken.' }, { ok: false }))
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/name already taken/i))
    expect(onItemAdded).not.toHaveBeenCalled()
  })

  it('shows a network error banner when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/network error/i))
  })

  it('shows the "checked out by" field only when status is checked-out', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    expect(screen.queryByLabelText(/checked out by/i)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/^status/i), 'checked-out')
    expect(screen.getByLabelText(/checked out by/i)).toBeInTheDocument()
  })

  it('Cancel clears the form and collapses it', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByLabelText(/^type/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/item name/i)).toHaveValue('')
  })

  it('Escape clears the form and collapses it', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByLabelText(/^type/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/item name/i)).toHaveValue('')
  })

  it('populates the subteam datalist with fetched subteams', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['electrical', 'mechanical', 'programming']),
    }))
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await startAdding(user)
    await user.selectOptions(screen.getByLabelText(/^status/i), 'checked-out')
    await waitFor(() => {
      expect(document.getElementById('add-subteam-options').options).toHaveLength(3)
    })
  })
})

describe('AddItemRow — tag validation', () => {
  let onItemAdded

  beforeEach(() => {
    onItemAdded = vi.fn()
    vi.stubGlobal('fetch', makeFetch({ id: 1, name: 'Cordless Drill', possibleDuplicate: null }))
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  async function fillRequiredAndTags(user, tagsValue) {
    await fillRequired(user)
    if (tagsValue) await user.type(screen.getByLabelText(/^tags/i), tagsValue)
  }

  it('shows an inline error when tags has a trailing comma', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequiredAndTags(user, 'motor,')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/no empty segments/i)).toBeInTheDocument()
    expect(onItemAdded).not.toHaveBeenCalled()
  })

  it('shows an inline error when tags has consecutive commas', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequiredAndTags(user, 'motor,,battery')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getByText(/no empty segments/i)).toBeInTheDocument()
    expect(onItemAdded).not.toHaveBeenCalled()
  })

  it('accepts valid comma-separated tags and submits', async () => {
    const user = userEvent.setup()
    render(<AddItemRow onItemAdded={onItemAdded} />)
    await fillRequiredAndTags(user, 'motor, battery')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    await waitFor(() => expect(onItemAdded).toHaveBeenCalled())
    const body = JSON.parse(postCalls()[0][1].body)
    expect(body.tags).toBe('motor, battery')
  })
})
