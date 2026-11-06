// Sidebar listing every area with its location count. Clicking an area shows its
// locations in the pane beside the list. "Unassigned" (id null) comes last.
// In edit mode each entry is a drop target: drag a location card onto an area's name
// to move it there. "+ New area" in the page header opens a name field at the bottom.
import { useEffect, useRef } from 'react';
import NameInput from './NameInput';

function AreaList({
  entries, selectedId, editing, dropAreaId, draggingId, addingArea,
  onSelect, onAddArea, onCancelAddArea,
  onDragEnterArea, onDragLeaveArea, onDropOnArea,
}) {
  const selectedRef = useRef(null);

  // On phones the list is a row that scrolls sideways; keep the selected area in view.
  useEffect(() => {
    selectedRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selectedId]);

  // Drag events only matter in edit mode.
  const dropHandlers = (areaId) => (editing ? {
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragEnterArea(areaId);
    },
    onDragLeave: (e) => {
      // dragleave also fires when moving onto the entry's own children; ignore those.
      if (!e.currentTarget.contains(e.relatedTarget)) onDragLeaveArea(areaId);
    },
    onDrop: (e) => {
      e.preventDefault();
      onDropOnArea(Number(e.dataTransfer.getData('text/plain')), areaId);
    },
  } : {});

  return (
    <nav className={`area-list${draggingId != null ? ' area-list--dragging' : ''}`} aria-label="Areas">
      {entries.map(({ id, name, count }) => {
        const classes = [
          'area-list__item',
          id === null && 'area-list__item--unassigned',
          id === selectedId && 'area-list__item--selected',
          id === dropAreaId && 'area-list__item--drop',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={id ?? 'unassigned'}
            ref={id === selectedId ? selectedRef : undefined}
            type="button"
            className={classes}
            aria-current={id === selectedId ? 'true' : undefined}
            onClick={() => onSelect(id)}
            {...dropHandlers(id)}
          >
            <span className="area-list__name">{name}</span>
            <span className="area-list__count">{count}</span>
          </button>
        );
      })}

      {addingArea && (
        <div className="area-list__new">
          <NameInput
            label="New area name"
            placeholder="New area name"
            className="name-input--compact"
            onSubmit={onAddArea}
            onCancel={onCancelAddArea}
          />
        </div>
      )}
    </nav>
  );
}

export default AreaList;
