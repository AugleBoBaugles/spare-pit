// Locations tab. A list of areas down the side; the selected area's locations show
// beside it as a grid of small boxes.
// "Edit" switches on managing them: drag a location onto an area in the list (or use
// its ⋯ menu), add/rename/delete areas and locations. Every change saves straight
// away; moves update the screen first and roll back if the server rejects them.
import { useState } from 'react';
import {
  createArea, renameArea, deleteArea,
  createLocation, updateLocation, deleteLocation,
} from '../../lib/api';
import { useLocations } from '../../utils/useLocations';
import AreaList from './AreaList';
import AreaSection from './AreaSection';
import '../../styles/LocationsPage.css';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const byName = (a, b) => collator.compare(a.name, b.name);

// `onOpenLocation({ id, name, area })` shows the inventory filtered to that location.
// `initialAreaId` / `onSelectArea(id)` let the app remember the selected area (null =
// Unassigned) while the user is away on the Inventory page.
function LocationsPage({ onOpenLocation, initialAreaId, onSelectArea }) {
  const { areas, setAreas, locations, setLocations, loading, error } = useLocations();
  // The area the user picked; falls back to the first one when unset or gone.
  const [chosenAreaId, setChosenAreaId] = useState(initialAreaId);
  const [editing, setEditing] = useState(false);
  const [addingArea, setAddingArea] = useState(false);
  const [actionError, setActionError] = useState(null);
  // Drag state: the card being dragged, and the area it's hovering over
  // (undefined = none; null = the Unassigned group).
  const [draggingId, setDraggingId] = useState(null);
  const [dropAreaId, setDropAreaId] = useState(undefined);

  // Runs a server change and reports whether it worked; failures show in the error banner.
  async function attempt(action) {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  }

  function toggleEditing() {
    setEditing((prev) => !prev);
    setAddingArea(false);
    setActionError(null);
  }

  function selectArea(id) {
    setChosenAreaId(id);
    onSelectArea?.(id);
  }

  // ── Areas ──

  // A new area opens straight away, ready for its first location.
  const handleAddArea = (name) => attempt(async () => {
    const area = await createArea(name);
    setAreas((prev) => [...prev, area]);
    setAddingArea(false);
    selectArea(area.id);
  });

  const handleRenameArea = (id, name) => attempt(async () => {
    const area = await renameArea(id, name);
    setAreas((prev) => prev.map((a) => (a.id === id ? area : a)));
  });

  const handleDeleteArea = (id) => attempt(async () => {
    await deleteArea(id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setLocations((prev) => prev.map((l) => (l.areaId === id ? { ...l, areaId: null } : l)));
  });

  // ── Locations ──

  const handleAddLocation = (name, areaId) => attempt(async () => {
    const location = await createLocation(name, areaId);
    setLocations((prev) => [...prev, location]);
  });

  const handleRenameLocation = (id, name) => attempt(async () => {
    const location = await updateLocation(id, { name });
    setLocations((prev) => prev.map((l) => (l.id === id ? location : l)));
  });

  const handleDeleteLocation = (id) => attempt(async () => {
    await deleteLocation(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  });

  // Moves show up immediately, then go back if the server says no.
  async function handleMoveLocation(id, areaId) {
    const before = locations.find((l) => l.id === id);
    if (!before || before.areaId === areaId) return;
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, areaId } : l)));
    const ok = await attempt(() => updateLocation(id, { areaId }));
    if (!ok) setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, areaId: before.areaId } : l)));
  }

  // ── Drag and drop ──

  function endDrag() {
    setDraggingId(null);
    setDropAreaId(undefined);
  }

  function handleDrop(id, areaId) {
    endDrag();
    if (Number.isInteger(id)) handleMoveLocation(id, areaId);
  }

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error.message}</p>;

  const sortedAreas = [...areas].sort(byName);
  const locationsIn = (areaId) => locations.filter((l) => l.areaId === areaId).sort(byName);
  const unassigned = locationsIn(null);
  const isEmpty = areas.length === 0 && locations.length === 0;

  // Unassigned is listed when it has locations, or in edit mode as a drop target.
  const showUnassigned = unassigned.length > 0 || (editing && !isEmpty);
  const entries = [
    ...sortedAreas.map((a) => ({ id: a.id, name: a.name, count: locationsIn(a.id).length })),
    ...(showUnassigned ? [{ id: null, name: 'Unassigned', count: unassigned.length }] : []),
  ];
  const selectedId = entries.some((e) => e.id === chosenAreaId) ? chosenAreaId : entries[0]?.id;
  const selectedArea = sortedAreas.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="locations-page">
      <div className="locations-header">
        <h2>Locations</h2>
        <div className="locations-header__actions">
          {editing && (
            <button type="button" onClick={() => setAddingArea(true)} disabled={addingArea}>
              + New area
            </button>
          )}
          <button
            type="button"
            className={editing ? 'active' : ''}
            onClick={toggleEditing}
            aria-pressed={editing}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      <p className="locations-summary">
        {areas.length} {areas.length === 1 ? 'area' : 'areas'} · {locations.length} {locations.length === 1 ? 'location' : 'locations'}
        {unassigned.length > 0 && <> · <span className="locations-summary__warn">{unassigned.length} unassigned</span></>}
      </p>

      {editing && (
        <p className="locations-hint">
          Drag a location onto an area in the list, or use its ⋯ menu. Changes save as you go.
        </p>
      )}

      {actionError && (
        <div role="alert" className="locations-banner">
          <span>{actionError}</span>
          <button
            type="button"
            className="locations-banner__dismiss"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {isEmpty && !addingArea ? (
        <p className="empty-state">
          No areas or locations yet. Click Edit, then “+ New area” to set up your first one.
        </p>
      ) : (
        <div className="locations-layout">
          <AreaList
            entries={entries}
            selectedId={selectedId}
            editing={editing}
            dropAreaId={dropAreaId}
            draggingId={draggingId}
            addingArea={addingArea}
            onSelect={selectArea}
            onAddArea={handleAddArea}
            onCancelAddArea={() => setAddingArea(false)}
            onDragEnterArea={setDropAreaId}
            onDragLeaveArea={(areaId) => setDropAreaId((prev) => (prev === areaId ? undefined : prev))}
            onDropOnArea={handleDrop}
          />

          {selectedId !== undefined && (
            <AreaSection
              // A fresh section per area, so a half-finished rename doesn't carry over.
              key={selectedId ?? 'unassigned'}
              area={selectedArea}
              locations={locationsIn(selectedId)}
              areas={sortedAreas}
              editing={editing}
              draggingId={draggingId}
              onDragStart={setDraggingId}
              onDragEnd={endDrag}
              onRenameArea={handleRenameArea}
              onDeleteArea={handleDeleteArea}
              onAddLocation={handleAddLocation}
              onOpenLocation={(location) => onOpenLocation({
                id: location.id,
                name: location.name,
                area: selectedArea?.name ?? null,
              })}
              onMoveLocation={handleMoveLocation}
              onRenameLocation={handleRenameLocation}
              onDeleteLocation={handleDeleteLocation}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default LocationsPage;
