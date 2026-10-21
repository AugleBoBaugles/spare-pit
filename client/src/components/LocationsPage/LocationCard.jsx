// One location tile inside an area's grid.
// View mode: a button showing the name and item count; clicking it calls onOpen(location)
// to show the inventory filtered to that location.
// Edit mode: draggable between areas, with a "Move to" menu (for touch screens and
// keyboards, where dragging isn't available), rename, and delete (only when empty).
import { useState } from 'react';
import NameInput from './NameInput';

function itemCountLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function LocationCard({
  location, areas, editing, isDragging,
  onOpen, onDragStart, onDragEnd, onMove, onRename, onDelete,
}) {
  const [renaming, setRenaming] = useState(false);
  const { id, name, areaId, itemCount } = location;

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
          <span className="location-card__name">{name}</span>
        )}
      </div>

      <span className="location-card__meta">{itemCountLabel(itemCount)}</span>

      <div className="location-card__tools">
        <select
          className="location-card__move"
          aria-label={`Move ${name} to area`}
          value={areaId ?? ''}
          onChange={(e) => onMove(id, e.target.value === '' ? null : Number(e.target.value))}
        >
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          <option value="">Unassigned</option>
        </select>
        <button
          type="button"
          className="location-card__tool"
          aria-label={`Rename ${name}`}
          title="Rename"
          onClick={() => setRenaming(true)}
        >
          ✎
        </button>
        <button
          type="button"
          className="location-card__tool location-card__tool--danger"
          aria-label={`Delete ${name}`}
          title={itemCount > 0 ? 'Move or delete its items before deleting this location' : 'Delete'}
          disabled={itemCount > 0}
          onClick={() => onDelete(id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default LocationCard;
