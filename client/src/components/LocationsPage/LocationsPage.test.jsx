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
  const onSelectArea = vi.fn()
  render(<LocationsPage onOpenLocation={onOpenLocation} onSelectArea={onSelectArea} {...props} />)
  await screen.findByRole('heading', { name: 'Locations' })
  return { onOpenLocation, onSelectArea }
}

const areaList = () => screen.getByRole('navigation', { name: 'Areas' })
// An area's entry in the list; its accessible name is the area name then its count.
const areaEntry = (name) => within(areaList()).getByRole('button', { name: new RegExp(`^${name}`) })
const areaNames = () =>
  within(areaList()).getAllByRole('button').map((el) => el.querySelector('.area-list__name').textContent)
const section = (name) => screen.getByRole('region', { name })
const cardNames = (name) =>
  within(section(name)).queryAllByText(/./, { selector: '.location-card__name' }).map((el) => el.textContent)

async function openArea(user, name) {
  await user.click(areaEntry(name))
}

async function startEditing(user) {
  await user.click(screen.getByRole('button', { name: 'Edit' }))
}

async function openMenu(user, locationName, areaName) {
  const scope = areaName ? within(section(areaName)) : screen
  await user.click(scope.getByRole('button', { name: `Options for ${locationName}` }))
  return screen.getByRole('menu', { name: `Options for ${locationName}` })
}

beforeEach(() => {
  vi.clearAllMocks()
  load()
})

describe('LocationsPage — view mode', () => {
  it('lists the areas in order with their counts, and Unassigned last', async () => {
    await renderPage()
    expect(areaNames()).toEqual(['Back Room', 'Machine Shop', 'Unassigned'])
    expect(areaEntry('Machine Shop')).toHaveTextContent('2')
    expect(screen.getByText(/2 areas · 4 locations/)).toBeInTheDocument()
  })

  it('shows the first area to start with, and another area when it is picked', async () => {
    const user = userEvent.setup()
    const { onSelectArea } = await renderPage()
    expect(cardNames('Back Room')).toEqual(['Tool Cabinet A'])
    expect(areaEntry('Back Room')).toHaveAttribute('aria-current', 'true')

    await openArea(user, 'Machine Shop')
    expect(cardNames('Machine Shop')).toEqual(['Metal Rack', 'Tool Cabinet A'])
    expect(screen.queryByRole('region', { name: 'Back Room' })).not.toBeInTheDocument()
    expect(onSelectArea).toHaveBeenCalledWith(1)

    await openArea(user, 'Unassigned')
    expect(cardNames('Unassigned')).toEqual(['Loose Shelf'])
    expect(onSelectArea).toHaveBeenCalledWith(null)
  })

  it('opens on the area it was given, e.g. when coming back from the inventory', async () => {
    await renderPage({ initialAreaId: 1 })
    expect(cardNames('Machine Shop')).toEqual(['Metal Rack', 'Tool Cabinet A'])
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
    expect(screen.queryByRole('button', { name: /options for/i })).not.toBeInTheDocument()
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
    expect(within(section('Back Room')).getByRole('button', { name: /add location/i })).toBeInTheDocument()
  })

  it('lists an empty Unassigned in edit mode, as somewhere to drop locations', async () => {
    const user = userEvent.setup()
    load({ ...DATA, locations: DATA.locations.filter((l) => l.areaId !== null) })
    await renderPage()
    expect(areaNames()).toEqual(['Back Room', 'Machine Shop'])
    await startEditing(user)
    expect(areaNames()).toEqual(['Back Room', 'Machine Shop', 'Unassigned'])
  })

  it('moves a location with its ⋯ menu', async () => {
    const user = userEvent.setup()
    updateLocation.mockResolvedValue({})
    await renderPage()
    await startEditing(user)
    await openArea(user, 'Unassigned')

    const menu = await openMenu(user, 'Loose Shelf')
    // Every area it could go to, but not the one it's already in.
    expect(within(menu).queryByRole('menuitem', { name: 'Unassigned' })).not.toBeInTheDocument()
    await user.click(within(menu).getByRole('menuitem', { name: 'Back Room' }))

    expect(updateLocation).toHaveBeenCalledWith(13, { areaId: 2 })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await openArea(user, 'Back Room')
    expect(cardNames('Back Room')).toEqual(['Loose Shelf', 'Tool Cabinet A'])
  })

  it('closes the ⋯ menu on Escape without changing anything', async () => {
    const user = userEvent.setup()
    await renderPage()
    await startEditing(user)

    await openMenu(user, 'Tool Cabinet A')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Options for Tool Cabinet A' })).toHaveFocus()
  })

  it('moves a location by dragging it onto an area in the list', async () => {
    const user = userEvent.setup()
    updateLocation.mockResolvedValue({})
    await renderPage({ initialAreaId: 1 })
    await startEditing(user)

    const dataTransfer = { setData: vi.fn(), getData: () => '11', effectAllowed: '', dropEffect: '' }
    fireEvent.dragStart(screen.getByTestId('location-card-11'), { dataTransfer })
    fireEvent.dragOver(areaEntry('Back Room'), { dataTransfer })
    expect(areaEntry('Back Room')).toHaveClass('area-list__item--drop')
    fireEvent.drop(areaEntry('Back Room'), { dataTransfer })

    expect(updateLocation).toHaveBeenCalledWith(11, { areaId: 2 })
    expect(cardNames('Machine Shop')).toEqual(['Tool Cabinet A'])
    expect(areaEntry('Back Room')).not.toHaveClass('area-list__item--drop')
    expect(areaEntry('Back Room')).toHaveTextContent('2')
  })

  it('puts a move back and shows the reason when the server refuses it', async () => {
    const user = userEvent.setup()
    updateLocation.mockRejectedValue(new Error('Back Room already has a location named "Tool Cabinet A"'))
    await renderPage({ initialAreaId: 1 })
    await startEditing(user)

    const menu = await openMenu(user, 'Tool Cabinet A', 'Machine Shop')
    await user.click(within(menu).getByRole('menuitem', { name: 'Back Room' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already has a location named/)
    expect(cardNames('Machine Shop')).toEqual(['Metal Rack', 'Tool Cabinet A'])
  })

  it('renames a location from its ⋯ menu', async () => {
    const user = userEvent.setup()
    updateLocation.mockResolvedValue({ id: 11, name: 'Steel Rack', areaId: 1, itemCount: 0 })
    await renderPage({ initialAreaId: 1 })
    await startEditing(user)

    const menu = await openMenu(user, 'Metal Rack')
    await user.click(within(menu).getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByLabelText('New name for Metal Rack')
    await user.clear(input)
    await user.type(input, 'Steel Rack{Enter}')

    expect(updateLocation).toHaveBeenCalledWith(11, { name: 'Steel Rack' })
    expect(await within(section('Machine Shop')).findByText('Steel Rack')).toBeInTheDocument()
  })

  it('only lets empty locations be deleted', async () => {
    const user = userEvent.setup()
    deleteLocation.mockResolvedValue({})
    await renderPage({ initialAreaId: 1 })
    await startEditing(user)

    let menu = await openMenu(user, 'Tool Cabinet A', 'Machine Shop')
    expect(within(menu).getByRole('menuitem', { name: /^Delete/ })).toBeDisabled()
    await user.keyboard('{Escape}')

    menu = await openMenu(user, 'Metal Rack')
    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }))

    expect(deleteLocation).toHaveBeenCalledWith(11)
    await waitFor(() => expect(cardNames('Machine Shop')).toEqual(['Tool Cabinet A']))
  })

  it('adds a new area and opens it', async () => {
    const user = userEvent.setup()
    createArea.mockResolvedValue({ id: 3, name: 'Pit' })
    await renderPage()
    await startEditing(user)

    await user.click(screen.getByRole('button', { name: /new area/i }))
    await user.type(screen.getByLabelText('New area name'), 'Pit{Enter}')

    expect(createArea).toHaveBeenCalledWith('Pit')
    expect(await screen.findByRole('region', { name: 'Pit' })).toBeInTheDocument()
    expect(areaEntry('Pit')).toHaveAttribute('aria-current', 'true')
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
    expect(areaNames()).toEqual(['Machine Shop', 'Unassigned'])
    // The deleted area was open, so the page falls back to the first area left.
    expect(section('Machine Shop')).toBeInTheDocument()
    await openArea(user, 'Unassigned')
    expect(cardNames('Unassigned')).toEqual(['Loose Shelf', 'Tool Cabinet A'])
  })
})
