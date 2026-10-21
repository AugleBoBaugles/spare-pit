// Inline "Add item" row shown above the inventory table. It looks like a single text field
// until the user starts typing a name, then expands to show every field (required first)
// so the item can be created without leaving the page. All form logic lives in useAddItemForm.
import { useRef, useState } from 'react';
import { useAddItemForm } from '../../utils/useAddItemForm';
import LocationFields from '../LocationFields';
import { ITEM_TYPES, ITEM_STATUSES, ITEM_CONDITIONS } from '../../utils/constants';

// Fields carried over to the next item after a successful add — items are usually
// entered in batches from the same spot, so this saves retyping.
const STICKY_FIELDS = ['type', 'areaKey', 'locationName'];

// Label + control + inline error, laid out as one cell of the expanded grid.
function Field({ id, label, required, error, wide, children }) {
  return (
    <div className={`add-item__field${wide ? ' add-item__field--wide' : ''}`}>
      <label className="add-item__label" htmlFor={id}>
        {label}{required && <span className="add-item__req"> *</span>}
      </label>
      {children}
      {error && <span className="add-item__field-error">{error}</span>}
    </div>
  );
}

function AddItemRow({ onItemAdded }) {
  // True once the user starts typing — reveals the rest of the fields.
  const [isAdding, setIsAdding] = useState(false);
  // Confirmation for the most recently added item: { name, duplicate }.
  const [lastAdded, setLastAdded] = useState(null);
  const nameRef = useRef(null);

  const {
    form, errors, submitting, imagePreview,
    subteams, tagSuggestions, areas, locations,
    handleChange, setField, handleImageChange, clearImage, handleSubmit, reset,
  } = useAddItemForm((item, possibleDuplicate) => {
    onItemAdded(item);
    setLastAdded({ name: item.name, duplicate: !!possibleDuplicate });
    setIsAdding(false);
    // Keep focus in the name field so the next item can be typed straight away.
    nameRef.current?.focus();
  }, { keepAfterSubmit: STICKY_FIELDS });

  function handleNameChange(e) {
    handleChange(e);
    setLastAdded(null);
    // Open as soon as a name is typed; close again if it's erased. Other fields keep their
    // values, so retyping the name brings back whatever was already filled in.
    setIsAdding(e.target.value !== '');
  }

  function handleCancel() {
    reset();
    setIsAdding(false);
  }

  function handleFormSubmit(e) {
    // Nothing to submit while collapsed (the name field is still empty).
    if (!isAdding) { e.preventDefault(); return; }
    handleSubmit(e);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && isAdding) {
      handleCancel();
      nameRef.current?.focus();
    }
  }

  return (
    <div className="add-item-section">
      <form
        className={`add-item${isAdding ? ' add-item--open' : ''}`}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        noValidate
      >
        {/* The name input is rendered in the same spot in both states so it keeps
            focus (and the cursor position) when the form expands. */}
        <div className="add-item__bar">
          <span className="add-item__icon" aria-hidden="true">+</span>
          <input
            ref={nameRef}
            id="add-name" name="name" type="text"
            className="add-item__name"
            aria-label="Item name"
            placeholder={isAdding ? 'Item name *' : 'Add item…'}
            value={form.name} onChange={handleNameChange}
            aria-invalid={!!errors.name}
            autoComplete="off"
          />
        </div>
        {errors.name && <span className="add-item__field-error add-item__name-error">{errors.name}</span>}

        {isAdding && (
          <div className="add-item__body">
            {errors.submit && (
              <div role="alert" className="add-item__banner add-item__banner--error">
                {errors.submit}
              </div>
            )}

            <p className="add-item__section-label">Required</p>
            <div className="add-item__grid">
              <Field id="add-type" label="Type" required error={errors.type}>
                <select
                  id="add-type" name="type"
                  value={form.type} onChange={handleChange}
                  aria-invalid={!!errors.type}
                >
                  <option value="">Select…</option>
                  {ITEM_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field id="add-quantity" label="Quantity" required error={errors.quantity}>
                <input
                  id="add-quantity" name="quantity" type="number" min="0"
                  value={form.quantity} onChange={handleChange}
                  aria-invalid={!!errors.quantity}
                />
              </Field>

              <Field id="add-status" label="Status" required error={errors.status}>
                <select
                  id="add-status" name="status"
                  value={form.status} onChange={handleChange}
                  aria-invalid={!!errors.status}
                >
                  {ITEM_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              {form.status === 'checked-out' && (
                <Field id="add-checkOutBy" label="Checked out by">
                  <input
                    id="add-checkOutBy" name="checkOutBy" type="text"
                    list="add-subteam-options"
                    value={form.checkOutBy} onChange={handleChange}
                    placeholder="e.g. electrical"
                  />
                  <datalist id="add-subteam-options">
                    {subteams.map(s => <option key={s} value={s} />)}
                  </datalist>
                </Field>
              )}
            </div>

            <p className="add-item__section-label">Optional</p>
            <div className="add-item__grid">
              <LocationFields
                idPrefix="add"
                classPrefix="add-item"
                areaKey={form.areaKey}
                locationName={form.locationName}
                onChange={setField}
                areas={areas}
                locations={locations}
                error={errors.location}
              />

              <Field id="add-condition" label="Condition">
                <select
                  id="add-condition" name="condition"
                  value={form.condition} onChange={handleChange}
                >
                  {ITEM_CONDITIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field id="add-tags" label="Tags" error={errors.tags} wide>
                <input
                  id="add-tags" name="tags" type="text"
                  list="add-tag-options"
                  value={form.tags} onChange={handleChange}
                  placeholder="Comma-separated, e.g. power, drilling"
                  aria-invalid={!!errors.tags}
                />
                <datalist id="add-tag-options">
                  {tagSuggestions.map(t => <option key={t} value={t} />)}
                </datalist>
              </Field>

              <Field id="add-notes" label="Notes" wide>
                <textarea
                  id="add-notes" name="notes" rows={2}
                  value={form.notes} onChange={handleChange}
                  placeholder="Usage notes, warnings, reminders…"
                />
              </Field>

              <Field id="add-itemImage" label="Image" wide>
                <input
                  id="add-itemImage" name="itemImage" type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span className="add-item__hint">
                  Image upload coming soon — only the filename is recorded for now.
                </span>
                {imagePreview && (
                  <div className="add-item__image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={clearImage}>Remove</button>
                  </div>
                )}
              </Field>
            </div>

            <div className="add-item__actions">
              <span className="add-item__hint">Enter to add · Esc to cancel</span>
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="active" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add item'}
              </button>
            </div>
          </div>
        )}
      </form>

      {lastAdded && (
        <p
          role="status"
          className={`add-item__confirm${lastAdded.duplicate ? ' add-item__confirm--warn' : ''}`}
        >
          Added “{lastAdded.name}”.
          {lastAdded.duplicate && ' Heads up — an item with this name already existed.'}
        </p>
      )}
    </div>
  );
}

export default AddItemRow;
