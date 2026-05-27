// Modal that asks the user to confirm a delete by typing "DELETE" exactly.
// Rendered via createPortal so it mounts on document.body rather than inside the <table>
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { deleteInventory } from '../../lib/api';

// Props:
//   item     — the inventory item to delete (needs item.id for the API call)
//   onClose  — called when the modal should close (Cancel or after any request outcome)
//   onDelete — called with item.id on a successful delete so the parent removes it from state
//   onError  — called with an error message string when the request fails
function DeleteConfirmModal({ item, onClose, onDelete, onError }) {
  // Tracks what the user has typed into the confirmation input.
  const [input, setInput] = useState('');

  async function handleConfirm() {
    try {
      await deleteInventory(item.id);
      // Tell the parent to remove the item from its list before closing
      onDelete(item.id);
      onClose();
    } catch {
      // Surface the error to the row (which shows it inline), then close the modal
      // so the user can see the item is still there.
      onError('Failed to delete item. Please try again.');
      onClose();
    }
  }

  return createPortal(
    // Clicking the backdrop (outside the dialog) dismisses the modal.
    <div className="delete-modal-backdrop" onClick={onClose}>
      {/* stopPropagation prevents backdrop clicks that land on the dialog itself
          from bubbling up and triggering onClose a second time. */}
      <div
        className="delete-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        // aria-labelledby links the dialog to its visible heading for screen readers.
        aria-labelledby="delete-modal-heading"
      >
        <p id="delete-modal-heading" className="delete-modal__message">
          Are you sure? Deleting this item will permanently remove it from your
          inventory. To confirm, type 'DELETE'.
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type DELETE to confirm"
          // Explicit aria-label because the placeholder is not announced reliably by all screen readers.
          aria-label="Type DELETE to confirm"
        />
        <div className="delete-modal__actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          {/* The Confirm button stays disabled until the user types the exact string "DELETE"
              (case-sensitive) to prevent accidental deletions. */}
          <button
            type="button"
            className="delete-modal__confirm-btn"
            disabled={input !== 'DELETE'}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    // Mount outside the table DOM so the overlay covers the full viewport.
    document.body,
  );
}

export default DeleteConfirmModal;
