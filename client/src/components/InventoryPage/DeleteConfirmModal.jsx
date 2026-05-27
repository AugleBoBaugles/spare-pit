import { createPortal } from 'react-dom';
import { useState } from 'react';
import { deleteInventory } from '../../lib/api';

function DeleteConfirmModal({ item, onClose, onDelete, onError }) {
  const [input, setInput] = useState('');

  async function handleConfirm() {
    try {
      await deleteInventory(item.id);
      onDelete(item.id);
      onClose();
    } catch {
      onError('Failed to delete item. Please try again.');
      onClose();
    }
  }

  return createPortal(
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div
        className="delete-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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
          aria-label="Type DELETE to confirm"
        />
        <div className="delete-modal__actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
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
    document.body,
  );
}

export default DeleteConfirmModal;
