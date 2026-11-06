// The ⋯ menu on a location card in edit mode: rename, delete, and move to another area.
// It's also how locations move on touch screens and keyboards, where dragging isn't
// available. Closes on Escape, on a click outside, or once an option is picked.
// Up/Down arrows move between options.
import { useEffect, useRef, useState } from 'react';

function LocationMenu({ location, areas, onRename, onDelete, onMove }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);
  const { name, areaId, itemCount } = location;

  useEffect(() => {
    if (!open) return;
    rootRef.current.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    function closeOnOutsideClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  function pick(action) {
    setOpen(false);
    action();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      toggleRef.current.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...rootRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const i = items.indexOf(document.activeElement);
    const step = e.key === 'ArrowDown' ? 1 : -1;
    items[(i + step + items.length) % items.length]?.focus();
  }

  // Every area except the one it's already in, then Unassigned (unless it's already there).
  const targets = [
    ...areas.filter((a) => a.id !== areaId).map((a) => ({ id: a.id, label: a.name })),
    ...(areaId != null ? [{ id: null, label: 'Unassigned' }] : []),
  ];

  return (
    <div className="location-menu" ref={rootRef} onKeyDown={open ? handleKeyDown : undefined}>
      <button
        ref={toggleRef}
        type="button"
        className="location-menu__toggle"
        aria-label={`Options for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋯
      </button>

      {open && (
        <div className="location-menu__popup" role="menu" aria-label={`Options for ${name}`}>
          <button type="button" role="menuitem" className="location-menu__item" onClick={() => pick(onRename)}>
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className="location-menu__item location-menu__item--danger"
            disabled={itemCount > 0}
            onClick={() => pick(onDelete)}
          >
            Delete
            {itemCount > 0 && <span className="location-menu__hint">Move its items out first</span>}
          </button>

          {targets.length > 0 && (
            <>
              <div className="location-menu__label" role="presentation">Move to</div>
              {targets.map((t) => (
                <button
                  key={t.id ?? 'unassigned'}
                  type="button"
                  role="menuitem"
                  className="location-menu__item"
                  onClick={() => pick(() => onMove(t.id))}
                >
                  {t.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationMenu;
