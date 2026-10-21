// One area: a heading and a grid of its location cards. `area` is null for the
// "Unassigned" group, which holds locations that aren't in any area yet.
// In edit mode the whole section is a drop target for dragged location cards.
import { useState } from 'react';
import LocationCard from './LocationCard';
import NameInput from './NameInput';

function AreaSection({
  area, locations, areas, editing, isDropTarget, draggingId,
  onDragEnterArea, onDragLeaveArea, onDropOnArea, onDragStart, onDragEnd,
  onRenameArea, onDeleteArea, onAddLocation,
  onOpenLocation, onMoveLocation, onRenameLocation, onDeleteLocation,
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);

  const areaId = area?.id ?? null;
  const title = area?.name ?? 'Unassigned';
  const count = locations.length;

  // Drag events only matter in edit mode.
  const dropHandlers = editing ? {
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragEnterArea(areaId);
    },
    onDragLeave: (e) => {
      // dragleave also fires when moving between the section's own children; ignore those.
      if (!e.currentTarget.contains(e.relatedTarget)) onDragLeaveArea(areaId);
    },
    onDrop: (e) => {
      e.preventDefault();
      onDropOnArea(Number(e.dataTransfer.getData('text/plain')), areaId);
    },
  } : {};

  return (
    <section
      className={`area${area ? '' : ' area--unassigned'}${editing ? ' area--editing' : ''}${isDropTarget ? ' area--drop' : ''}`}
      aria-label={title}
      {...dropHandlers}
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
          {count > 0
            ? `${count === 1 ? 'This location isn’t' : 'These locations aren’t'} in an area yet.${editing ? ' Drag them into one below.' : ' Click Edit to sort them.'}`
            : 'Drop a location here to take it out of its area.'}
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
          <p className="area__empty">No locations yet.</p>
        )}
      </div>
    </section>
  );
}

export default AreaSection;
