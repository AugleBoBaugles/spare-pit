// Modal for moving an item to a different location. Areas are listed as collapsible groups;
// expanding one shows its locations, and the user picks one then confirms with "Move".
// Rendered via createPortal so it mounts on document.body rather than inside the <table>.
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { patchInventory } from '../../lib/api';
import { useLocations, areaKeyFor, locationsInArea, UNASSIGNED } from '../../utils/useLocations';

const byName = (a, b) => a.name.localeCompare(b.name);

// Props:
//   item         — the inventory item being moved
//   onClose      — called when the modal should close (Cancel, backdrop click, or after a move)
//   onItemUpdate — called with the updated item on a successful move so the list updates
function MoveItemModal({ item, onClose, onItemUpdate }) {
  const { areas, locations, loading, error } = useLocations();
  // Area keys (see useLocations) of the groups currently expanded. The item's own area starts open.
  const [openAreas, setOpenAreas] = useState(() => new Set([areaKeyFor(item)]));
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // One group per area, plus an "Unassigned" group when some locations have no area.
  const groups = [...areas].sort(byName).map((a) => ({ key: String(a.id), name: a.name }));
  if (locations.some((l) => l.areaId == null)) groups.push({ key: UNASSIGNED, name: 'Unassigned' });

  function toggleArea(key) {
    setOpenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleMove() {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchInventory(item.id, { locationId: selectedId });
      onItemUpdate(updated);
      onClose();
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  }

  const currentLabel = item.location
    ? `${item.location}${item.area ? ` · ${item.area}` : ''}`
    : 'No location';

  return createPortal(
    // Clicking the backdrop (outside the dialog) dismisses the modal.
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div
        className="delete-modal move-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-modal-heading"
      >
        <div className="move-modal__header">
          <h2 id="move-modal-heading" className="move-modal__title">Move {item.name}</h2>
          <p className="move-modal__current">Currently in: {currentLabel}</p>
        </div>

        <div className="move-modal__areas">
          {loading ? (
            <p className="move-modal__empty">Loading locations…</p>
          ) : error ? (
            <p className="move-modal__error">Failed to load locations.</p>
          ) : groups.length === 0 ? (
            <p className="move-modal__empty">No locations yet. Add some on the Locations page.</p>
          ) : (
            groups.map(({ key, name }) => {
              const isOpen = openAreas.has(key);
              const areaLocations = locationsInArea(locations, key).sort(byName);
              return (
                <div key={key} className="move-modal__area">
                  <button
                    type="button"
                    className="move-modal__area-btn"
                    onClick={() => toggleArea(key)}
                    aria-expanded={isOpen}
                  >
                    <span className="move-modal__chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                    {name}
                    <span className="move-modal__count">{areaLocations.length}</span>
                  </button>

                  {isOpen && (
                    areaLocations.length === 0 ? (
                      <p className="move-modal__empty move-modal__empty--nested">No locations in this area.</p>
                    ) : (
                      <ul className="move-modal__locations">
                        {areaLocations.map((loc) => {
                          const isCurrent = loc.id === item.locationId;
                          const isSelected = loc.id === selectedId;
                          return (
                            <li key={loc.id}>
                              <button
                                type="button"
                                className={`move-modal__location${isSelected ? ' move-modal__location--selected' : ''}`}
                                onClick={() => setSelectedId(loc.id)}
                                disabled={isCurrent}
                                aria-pressed={isSelected}
                              >
                                {loc.name}
                                {isCurrent && <span className="move-modal__tag">current</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

        {saveError && <p className="move-modal__error">{saveError}</p>}

        <div className="delete-modal__actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          {/* Disabled until a destination is picked, so a stray click can't move the item. */}
          <button
            type="button"
            className="active"
            disabled={selectedId === null || saving}
            onClick={handleMove}
          >
            {saving ? 'Moving…' : 'Move'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default MoveItemModal;
