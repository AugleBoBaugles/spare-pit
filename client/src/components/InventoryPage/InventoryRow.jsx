// A single inventory table row. Renders a summary row and, when open, the ExpandedPanel beneath it.
import { useEffect, useRef, useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import ExpandedPanel from './ExpandedPanel';

// Maps a status value to its CSS class for the coloured pill badge.
function getStatusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'missing')   return 'status-missing';
  return 'status-in-use';
}

// `onItemUpdate` bubbles edited data up; `onDelete` bubbles the deleted id up — both keep
// the list in sync without a full re-fetch from the server.
function InventoryRow({ item, isOpen, onToggle, onItemUpdate, onDelete }) {
  // Controls whether the three-dot dropdown is visible.
  const [menuOpen, setMenuOpen] = useState(false);
  // Controls whether ExpandedPanel is in edit mode or read mode.
  const [isEditing, setIsEditing] = useState(false);
  // Controls whether the delete confirmation modal is visible.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Holds an error message if a delete request fails; shown inline below the row.
  const [deleteError, setDeleteError] = useState(null);
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

  // Called when the user clicks "Delete" in the dropdown.
  function handleDeleteClick() {
    setMenuOpen(false);
    setShowDeleteModal(true);
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
                <li role="none">
                  <button role="menuitem" className="btn-delete" onClick={handleDeleteClick}>Delete</button>
                </li>
              </ul>
            )}
          </div>
        </td>
      </tr>

      {/* If a delete request fails, show the error as a full-width row directly below
          the affected item so it's visually connected. colSpan={5} spans all table columns.
          The dismiss button lets the user clear the message once they've read it. */}
      {deleteError && (
        <tr className="delete-error-row">
          <td colSpan={5} className="delete-error-cell">
            {deleteError}
            <button
              className="delete-error-dismiss"
              onClick={() => setDeleteError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </td>
        </tr>
      )}

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

      {/* DeleteConfirmModal uses createPortal to render on document.body, so placing it
          here in the fragment doesn't violate table DOM rules. onError stores the message
          in local state so it displays as the error row above after the modal closes. */}
      {showDeleteModal && (
        <DeleteConfirmModal
          item={item}
          onClose={() => setShowDeleteModal(false)}
          onDelete={onDelete}
          onError={(msg) => setDeleteError(msg)}
        />
      )}
    </>
  );
}

export default InventoryRow;
