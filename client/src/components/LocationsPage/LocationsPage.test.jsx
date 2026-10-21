import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LocationsPage from './LocationsPage'

vi.mock('../../lib/api', () => ({
  fetchLocations: vi.fn(),
  createArea: vi.fn(),
  renameArea: vi.fn(),
  deleteArea: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}))
import {
  fetchLocations, createArea, deleteArea, updateLocation, deleteLocation,
} from '../../lib/api'

// Two areas that both have a "Tool Cabinet A", plus one unassigned location.
const DATA = {
  areas: [{ id: 1, name: 'Machine Shop' }, { id: 2, name: 'Back Room' }],
  locations: [
    { id: 10, name: 'Tool Cabinet A', areaId: 1, itemCount: 2 },
    { id: 11, name: 'Metal Rack', areaId: 1, itemCount: 0 },
    { id: 12, name: 'Tool Cabinet A', areaId: 2, itemCount: 1 },
    { id: 13, name: 'Loose Shelf', areaId: null, itemCount: 0 },
  ],
}

// Copies so tests that change state can't leak into each other.
function load(data = DATA) {
  fetchLocations.mockResolvedValue(structuredClone(data))
}

async function renderPage(props = {}) {
  const onOpenLocation = vi.fn()
  render(<LocationsPage onOpenLocation={onOpenLocation} {...props} />)
  await screen.findByRole('heading', { name: 'Locations' })
  return { onOpenLocation }
}

const section = (name) => screen.getByRole('region', { name })
const cardNames = (name) =>
  within(section(name)).queryAllByText(/./, { selector: '.location-card__name' }).map((el) => el.textContent)

async function startEditing(user) {
  await user.click(screen.getByRole('button', { name: 'Edit' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  load()
})

describe('LocationsPage — view mode', () => {
  it('shows each area with its locations, and unassigned locations in their own group', async () => {
    await renderPage()
    expect(cardNames('Machine Shop')).toEqual(['Metal Rack', 'Tool Cabinet A'])
    expect(cardNames('Back Room')).toEqual(['Tool Cabinet A'])
    expect(cardNames('Unassigned')).toEqual(['Loose Shelf'])
    expect(screen.getByText(/2 areas · 4 locations/)).toBeInTheDocument()
  })

  it('opens the inventory for the exact location clicked, with its area', async () => {
    const user = userEvent.setup()
    const { onOpenLocation } = await renderPage()
    await user.click(within(section('Back Room')).getByRole('button', { name: /tool cabinet a/i }))
    expect(onOpenLocation).toHaveBeenCalledWith({ id: 12, name: 'Tool Cabinet A', area: 'Back Room' })
  })

  it('hides the editing controls until Edit is clicked', async () => {
    await renderPage()
    expect(screen.queryByRole('button', { name: /new area/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/move .* to area/i)).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no areas or locations', async () => {
    load({ areas: [], locations: [] })
    await renderPage()
    expect(screen.getByText(/no areas or locations yet/i)).toBeInTheDocument()
  })
})

describe('LocationsPage — edit mode', () => {
  it('Edit turns into Done and reveals the editing controls', async () => {
    const user = userEvent.setup()
    await renderPage()
    await startEditing(user)
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new area/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /add location/i })).toHaveLength(2)
  })

  it('moves a location with its "Move to" menu', async () => {
    const user = userEvent.setup()
    updateLocation.mockResolvedValue({})
    await renderPage()
    await startEditing(user)

    await user.selectOptions(screen.getByLabelText('Move Loose Shelf to area'), 'Back Room')

    expect(updateLocation).toHaveBeenCalledWith(13, { areaId: 2 })
    expect(cardNames('Back Room')).toEqual(['Loose Shelf', 'Tool Cabinet A'])
  })

  it('moves a location by dragging it onto another area', async () => {
    const user = userEvent.setup()
    updateLocation.mockResolvedValue({})
    await renderPage()
    await startEditing(user)

    const dataTransfer = { setData: vi.fn(), getData: () => '11', effectAllowed: '', dropEffect: '' }
    fireEvent.dragStart(screen.getByTestId('location-card-11'), { dataTransfer })
    fireEvent.dragOver(section('Back Room'), { dataTransfer })
    expect(section('Back Room')).toHaveClass('area--drop')
    fireEvent.drop(section('Back Room'), { dataTransfer })

    expect(updateLocation).toHaveBeenCalledWith(11, { areaId: 2 })
    expect(cardNames('Back Room')).toContain('Metal Rack')
    expect(section('Back Room')).not.toHaveClass('area--drop')
  })

  it('puts a move back and shows the reason when the server refuses it', async () => {
    const user = userEvent.setup()
    updateLocation.mockRejectedValue(new Error('Back Room already has a location named "Tool Cabinet A"'))
    await renderPage()
    await startEditing(user)

    await user.selectOptions(within(section('Machine Shop')).getByLabelText('Move Tool Cabinet A to area'), 'Back Room')

    expect(await screen.findByRole('alert')).toHaveTextContent(/already has a location named/)
    expect(cardNames('Machine Shop')).toEqual(['Metal Rack', 'Tool Cabinet A'])
  })

  it('only lets empty locations be deleted', async () => {
    const user = userEvent.setup()
    deleteLocation.mockResolvedValue({})
    await renderPage()
    await startEditing(user)

    expect(within(section('Machine Shop')).getByRole('button', { name: 'Delete Tool Cabinet A' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Delete Metal Rack' }))

    expect(deleteLocation).toHaveBeenCalledWith(11)
    expect(cardNames('Machine Shop')).toEqual(['Tool Cabinet A'])
  })

  it('adds a new area', async () => {
    const user = userEvent.setup()
    createArea.mockResolvedValue({ id: 3, name: 'Pit' })
    await renderPage()
    await startEditing(user)

    await user.click(screen.getByRole('button', { name: /new area/i }))
    await user.type(screen.getByLabelText('New area name'), 'Pit{Enter}')

    expect(createArea).toHaveBeenCalledWith('Pit')
    expect(await screen.findByRole('region', { name: 'Pit' })).toBeInTheDocument()
  })

  it('asks before deleting an area, then moves its locations to Unassigned', async () => {
    const user = userEvent.setup()
    deleteArea.mockResolvedValue({})
    await renderPage()
    await startEditing(user)

    await user.click(within(section('Back Room')).getByRole('button', { name: 'Delete' }))
    expect(screen.getByText(/its 1 location moves to unassigned/i)).toBeInTheDocument()
    expect(deleteArea).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete area' }))

    await waitFor(() => expect(screen.queryByRole('region', { name: 'Back Room' })).not.toBeInTheDocument())
    expect(deleteArea).toHaveBeenCalledWith(2)
    expect(cardNames('Unassigned')).toEqual(['Loose Shelf', 'Tool Cabinet A'])
  })
})
