// Locations tab. Shows every area as a heading with a grid of its locations.
// "Edit" switches on managing them: drag locations between areas (or use each card's
// "Move to" menu), add/rename/delete areas and locations. Every change saves straight
// away; moves update the screen first and roll back if the server rejects them.
import { useState } from 'react';
import {
  createArea, renameArea, deleteArea,
  createLocation, updateLocation, deleteLocation,
} from '../../lib/api';
import { useLocations } from '../../utils/useLocations';
import AreaSection from './AreaSection';
import NameInput from './NameInput';
import '../../styles/LocationsPage.css';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const byName = (a, b) => collator.compare(a.name, b.name);

// `onOpenLocation({ id, name, area })` shows the inventory filtered to that location.
function LocationsPage({ onOpenLocation }) {
  const { areas, setAreas, locations, setLocations, loading, error } = useLocations();
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

  // ── Areas ──

  const handleAddArea = (name) => attempt(async () => {
    const area = await createArea(name);
    setAreas((prev) => [...prev, area]);
    setAddingArea(false);
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

  // Props every AreaSection shares.
  const sectionProps = {
    areas: sortedAreas,
    editing,
    draggingId,
    onDragEnterArea: setDropAreaId,
    onDragLeaveArea: (areaId) => setDropAreaId((prev) => (prev === areaId ? undefined : prev)),
    onDropOnArea: handleDrop,
    onDragStart: setDraggingId,
    onDragEnd: endDrag,
    onRenameArea: handleRenameArea,
    onDeleteArea: handleDeleteArea,
    onAddLocation: handleAddLocation,
    onOpenLocation: (location) => onOpenLocation({
      id: location.id,
      name: location.name,
      area: areas.find((a) => a.id === location.areaId)?.name ?? null,
    }),
    onMoveLocation: handleMoveLocation,
    onRenameLocation: handleRenameLocation,
    onDeleteLocation: handleDeleteLocation,
  };

  const isEmpty = areas.length === 0 && locations.length === 0;

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
          Drag locations between areas, or use the menu on each card. Changes save as you go.
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

      {addingArea && (
        <div className="area area--new">
          <NameInput
            label="New area name"
            placeholder="New area name, e.g. Back Room"
            className="name-input--heading"
            onSubmit={handleAddArea}
            onCancel={() => setAddingArea(false)}
          />
        </div>
      )}

      {isEmpty && !addingArea && (
        <p className="empty-state">
          No areas or locations yet. Click Edit, then “+ New area” to set up your first one.
        </p>
      )}

      {(unassigned.length > 0 || (editing && !isEmpty)) && (
        <AreaSection
          area={null}
          locations={unassigned}
          isDropTarget={dropAreaId === null}
          {...sectionProps}
        />
      )}

      {sortedAreas.map((area) => (
        <AreaSection
          key={area.id}
          area={area}
          locations={locationsIn(area.id)}
          isDropTarget={dropAreaId === area.id}
          {...sectionProps}
        />
      ))}
    </div>
  );
}

export default LocationsPage;
