// One small location box inside an area's grid.
// View mode: a button showing the name and item count; clicking it calls onOpen(location)
// to show the inventory filtered to that location.
// Edit mode: the same size box, draggable onto an area in the area list, with a ⋯ menu
// for rename, delete (only when empty), and "Move to" (for touch screens and keyboards).
import { useState } from 'react';
import LocationMenu from './LocationMenu';
import NameInput from './NameInput';

function itemCountLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function LocationCard({
  location, areas, editing, isDragging,
  onOpen, onDragStart, onDragEnd, onMove, onRename, onDelete,
}) {
  const [renaming, setRenaming] = useState(false);
  const { id, name, itemCount } = location;

  if (!editing) {
    return (
      <button
        type="button"
        className="location-card"
        onClick={() => onOpen(location)}
        title={`Show items in ${name}`}
      >
        <span className="location-card__name">{name}</span>
        <span className="location-card__meta">{itemCountLabel(itemCount)}</span>
      </button>
    );
  }

  return (
    <div
      className={`location-card location-card--editing${isDragging ? ' location-card--dragging' : ''}`}
      draggable={!renaming}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(id));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(id);
      }}
      onDragEnd={onDragEnd}
      data-testid={`location-card-${id}`}
    >
      <div className="location-card__top">
        <span className="location-card__grip" aria-hidden="true">⠿</span>
        {renaming ? (
          <NameInput
            initial={name}
            label={`New name for ${name}`}
            className="name-input--compact"
            onSubmit={async (newName) => {
              const ok = await onRename(id, newName);
              if (ok) setRenaming(false);
              return ok;
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <span className="location-card__name">{name}</span>
            <LocationMenu
              location={location}
              areas={areas}
              onRename={() => setRenaming(true)}
              onDelete={() => onDelete(id)}
              onMove={(areaId) => onMove(id, areaId)}
            />
          </>
        )}
      </div>

      <span className="location-card__meta">{itemCountLabel(itemCount)}</span>
    </div>
  );
}

export default LocationCard;
