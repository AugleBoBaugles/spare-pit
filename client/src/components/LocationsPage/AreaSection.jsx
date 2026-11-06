// The selected area: a heading and a grid of its location cards, shown beside the area
// list. `area` is null for the "Unassigned" group, which holds locations that aren't in
// any area yet. In edit mode the heading gets Rename/Delete and the grid an
// "+ Add location" tile; moving cards happens by dropping them on the area list.
import { useState } from 'react';
import LocationCard from './LocationCard';
import NameInput from './NameInput';

function AreaSection({
  area, locations, areas, editing, draggingId,
  onDragStart, onDragEnd,
  onRenameArea, onDeleteArea, onAddLocation,
  onOpenLocation, onMoveLocation, onRenameLocation, onDeleteLocation,
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);

  const title = area?.name ?? 'Unassigned';
  const count = locations.length;

  return (
    <section
      className={`area${area ? '' : ' area--unassigned'}`}
      aria-label={title}
    >
      <header className="area__header">
        {renaming ? (
          <NameInput
            initial={area.name}
            label={`New name for ${area.name}`}
            className="name-input--heading"
            onSubmit={async (name) => {
              const ok = await onRenameArea(area.id, name);
              if (ok) setRenaming(false);
              return ok;
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <h3 className="area__name">{title}</h3>
        )}
        <span className="area__count">{count} {count === 1 ? 'location' : 'locations'}</span>

        {editing && area && !renaming && !confirmingDelete && (
          <span className="area__actions">
            <button type="button" className="area__action" onClick={() => setRenaming(true)}>
              Rename
            </button>
            <button
              type="button"
              className="area__action area__action--danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          </span>
        )}
      </header>

      {confirmingDelete && (
        <div className="area__confirm" role="alert">
          <span>
            Delete “{area.name}”?
            {count > 0 && ` Its ${count} ${count === 1 ? 'location moves' : 'locations move'} to Unassigned — no items are deleted.`}
          </span>
          <span className="area__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
            <button
              type="button"
              className="area__confirm-delete"
              onClick={() => onDeleteArea(area.id)}
            >
              Delete area
            </button>
          </span>
        </div>
      )}

      {!area && (
        <p className="area__note">
          {count === 1 && `This location isn’t in an area yet.${editing ? ' Drag it onto an area in the list, or use its ⋯ menu.' : ' Click Edit to sort it.'}`}
          {count > 1 && `These locations aren’t in an area yet.${editing ? ' Drag them onto an area in the list, or use their ⋯ menus.' : ' Click Edit to sort them.'}`}
          {count === 0 && 'Drop a location on “Unassigned” in the list to take it out of its area.'}
        </p>
      )}

      <div className="area__grid">
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            areas={areas}
            editing={editing}
            isDragging={draggingId === loc.id}
            onOpen={onOpenLocation}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMove={onMoveLocation}
            onRename={onRenameLocation}
            onDelete={onDeleteLocation}
          />
        ))}

        {editing && area && (addingLocation ? (
          <div className="location-card location-card--input">
            <NameInput
              label={`New location in ${area.name}`}
              placeholder="Location name"
              className="name-input--compact"
              onSubmit={async (name) => {
                const ok = await onAddLocation(name, area.id);
                if (ok) setAddingLocation(false);
                return ok;
              }}
              onCancel={() => setAddingLocation(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            className="location-card location-card--add"
            onClick={() => setAddingLocation(true)}
          >
            + Add location
          </button>
        ))}

        {!editing && area && count === 0 && (
          <p className="area__empty">No locations yet. Click Edit to add one.</p>
        )}
      </div>
    </section>
  );
}

export default AreaSection;
