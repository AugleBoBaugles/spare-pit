// Page for adding a new inventory item. All form logic lives in useAddItemForm.
import '../styles/AddItemPage.css';
import { useAddItemForm } from '../utils/useAddItemForm';
import { ITEM_TYPES, ITEM_STATUSES, ITEM_CONDITIONS } from '../utils/constants';

function AddItemPage({ onNavigate }) {
  const {
    form, errors, duplicate, submitting, imagePreview,
    subteams, tagSuggestions,
    handleChange, handleImageChange, clearImage, handleSubmit,
  } = useAddItemForm(() => onNavigate('inventory'));

  return (
    <div className="add-item-page">
      <h2>Add to Inventory</h2>
      <p className="page-sub">
        Fields marked <span className="req">*</span> are required.
      </p>

      {errors.submit && (
        <div role="alert" className="banner banner--error">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        <h3>Basic info</h3>

        <div className="field">
          <label htmlFor="name">Item name <span className="req">*</span></label>
          <input
            id="name" name="name" type="text"
            value={form.name} onChange={handleChange}
            placeholder="e.g. Cordless Drill"
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="type">Type <span className="req">*</span></label>
            <select
              id="type" name="type"
              value={form.type} onChange={handleChange}
              aria-invalid={!!errors.type}
            >
              <option value="">Select…</option>
              {ITEM_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.type && <span className="field-error">{errors.type}</span>}
          </div>

          <div className="field">
            <label htmlFor="status">Status <span className="req">*</span></label>
            <select
              id="status" name="status"
              value={form.status} onChange={handleChange}
              aria-invalid={!!errors.status}
            >
              {ITEM_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.status && <span className="field-error">{errors.status}</span>}
          </div>
        </div>

        {form.status === 'checked-out' && (
          <div className="field">
            <label htmlFor="checkOutBy">Checked out by</label>
            <input
              id="checkOutBy" name="checkOutBy" type="text"
              list="subteam-options"
              value={form.checkOutBy} onChange={handleChange}
              placeholder="e.g. electrical"
            />
            <datalist id="subteam-options">
              {subteams.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        )}

        <h3>Location</h3>

        <div className="row-2">
          <div className="field">
            <label htmlFor="location">Location <span className="req">*</span></label>
            <input
              id="location" name="location" type="text"
              value={form.location} onChange={handleChange}
              placeholder="e.g. Tool Cabinet A"
              aria-invalid={!!errors.location}
            />
            {errors.location && <span className="field-error">{errors.location}</span>}
          </div>

          <div className="field">
            <label htmlFor="area">Area</label>
            <input
              id="area" name="area" type="text"
              value={form.area} onChange={handleChange}
              placeholder="e.g. Machine Shop"
            />
          </div>
        </div>

        <h3>Details</h3>

        <div className="row-2">
          <div className="field">
            <label htmlFor="quantity">Quantity <span className="req">*</span></label>
            <input
              id="quantity" name="quantity" type="number" min="0"
              value={form.quantity} onChange={handleChange}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && <span className="field-error">{errors.quantity}</span>}
          </div>

          <div className="field">
            <label htmlFor="condition">Condition</label>
            <select
              id="condition" name="condition"
              value={form.condition} onChange={handleChange}
            >
              {ITEM_CONDITIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="tags">Tags</label>
          <input
            id="tags" name="tags" type="text"
            list="tag-options"
            value={form.tags} onChange={handleChange}
            placeholder="e.g. power, drilling, electronics"
            aria-invalid={!!errors.tags}
          />
          <datalist id="tag-options">
            {tagSuggestions.map(t => <option key={t} value={t} />)}
          </datalist>
          <span className="hint">Comma-separated keywords for filtering.</span>
          {errors.tags && <span className="field-error">{errors.tags}</span>}
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes" name="notes"
            value={form.notes} onChange={handleChange}
            placeholder="Usage notes, warnings, reminders…"
          />
        </div>

        <h3>Image</h3>

        <div className="field">
          <label htmlFor="itemImage">Item image</label>
          <input
            id="itemImage" name="itemImage" type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input-file"
          />
          <span className="hint">
            Image upload coming soon — your file won't be saved to the server yet, but the filename will be recorded.
          </span>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" className="image-clear" onClick={clearImage}>
                Remove
              </button>
            </div>
          )}
        </div>

        {duplicate && (
          <div role="alert" className="banner banner--warn">
            An item with this name already exists. It's been added — just a heads up. Redirecting…
          </div>
        )}

        <div className="btn-row">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Item'}
          </button>
          <button type="button" onClick={() => onNavigate('inventory')}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

export default AddItemPage;
