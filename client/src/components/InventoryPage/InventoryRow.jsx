// A single inventory table row. Renders a summary row and, when open, the ExpandedPanel beneath it.
import { useEffect, useRef, useState } from 'react';
import ExpandedPanel from './ExpandedPanel';

function getStatusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'missing')   return 'status-missing';
  return 'status-in-use';
}

function InventoryRow({ item, isOpen, onToggle, onItemUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleEditClick() {
    setMenuOpen(false);
    if (!isOpen) onToggle();
    setIsEditing(true);
  }

  return (
    <>
      <tr
        className={`inventory-row ${isOpen ? 'inventory-row--expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onToggle() : null}
      >
        <td className="col-name">{item.name}</td>
        <td className="col-muted capitalize">{item.type}</td>
        <td className="col-muted">{item.location}</td>
        <td>
          <span className={`status-pill ${getStatusClass(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
          <div ref={menuRef} className="row-menu">
            <button
              className="row-menu__trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Row actions"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              ⋯
            </button>
            {menuOpen && (
              <ul className="row-menu__dropdown" role="menu">
                <li role="none">
                  <button role="menuitem" onClick={handleEditClick}>Edit</button>
                </li>
                <li role="none">
                  <button role="menuitem" disabled>Delete</button>
                </li>
              </ul>
            )}
          </div>
        </td>
      </tr>

      {isOpen && (
        <ExpandedPanel
          item={item}
          isEditing={isEditing}
          onEditingChange={setIsEditing}
          onItemUpdate={onItemUpdate}
        />
      )}
    </>
  );
}

export default InventoryRow;
