// A single inventory table row. Renders a summary row and, when open, the ExpandedPanel beneath it.
import { useEffect, useRef, useState } from 'react';
import ExpandedPanel from './ExpandedPanel';

// Maps a status value to its CSS class for the coloured pill badge.
function getStatusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'missing')   return 'status-missing';
  return 'status-in-use';
}

// `onItemUpdate` bubbles up to InventoryPage so the list reflects edits without a re-fetch.
function InventoryRow({ item, isOpen, onToggle, onItemUpdate }) {
  // Controls whether the three-dot dropdown is visible.
  const [menuOpen, setMenuOpen] = useState(false);
  // Controls whether ExpandedPanel is in edit mode or read mode.
  const [isEditing, setIsEditing] = useState(false);
  // A ref attached to the dropdown container so we can detect clicks outside it.
  const menuRef = useRef(null);

  // Close the dropdown when the user clicks anywhere outside of it.
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

  // Called when the user clicks "Edit" in the dropdown.
  function handleEditClick() {
    setMenuOpen(false);
    // If the row is collapsed, expand it first so the panel is visible before edit mode opens.
    if (!isOpen) onToggle();
    setIsEditing(true);
  }

  return (
    <>
      <tr
        className={`inventory-row ${isOpen ? 'inventory-row--expanded' : ''}`}
        onClick={onToggle}
        // Tells screen readers whether the accordion section below is open.
        aria-expanded={isOpen}
        // Makes the <tr> behave as a button for keyboard and assistive technology users.
        role="button"
        tabIndex={0}
        // Lets keyboard users expand/collapse the row with Enter or Space.
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

        {/* stopPropagation prevents clicking inside this cell from also firing the
            row's onClick (which would collapse/expand the accordion). */}
        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
          <div ref={menuRef} className="row-menu">
            <button
              className="row-menu__trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              // Accessible label for screen readers since the button only shows "⋯".
              aria-label="Row actions"
              // Tells screen readers this button opens a menu.
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              ⋯
            </button>

            {/* The dropdown only renders when menuOpen is true.
                It's a <ul> with role="menu" so screen readers know it's a menu.
                Each <li> has role="none" to reset list semantics; the <button> inside
                gets role="menuitem" so it reads as a menu option. */}
            {menuOpen && (
              <ul className="row-menu__dropdown" role="menu">
                <li role="none">
                  <button role="menuitem" onClick={handleEditClick}>Edit</button>
                </li>
                {/* Delete is stubbed out as disabled so the menu structure is already
                    in place for when the feature is built. */}
                <li role="none">
                  <button role="menuitem" disabled>Delete</button>
                </li>
              </ul>
            )}
          </div>
        </td>
      </tr>

      {/* ExpandedPanel only renders when the row is open.
          We pass isEditing and onEditingChange so the panel knows which mode to display,
          and onItemUpdate so it can tell the list to update after a successful save. */}
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
