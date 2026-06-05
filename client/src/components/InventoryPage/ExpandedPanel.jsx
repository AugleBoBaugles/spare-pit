// Renders the expanded detail panel for an inventory item, in read or edit mode.
import { useEffect, useState } from 'react';
import { patchInventory } from '../../lib/api';

// Fetches the list of subteam names (e.g. "electrical", "programming") from the server.
// These populate the autocomplete suggestions on the "Checked out by" field.
function useSubteams() {
  const [subteams, setSubteams] = useState([]);
  useEffect(() => {
    fetch('/api/inventory/subteams')
      .then((r) => r.json())
      .then(setSubteams)
      // Silently ignore fetch failures — the field still works as a plain text input.
      .catch(() => {});
  }, []);
  return subteams;
}

// Fetches the deduplicated tag list for autocomplete suggestions on the tags field.
function useTags() {
  const [tags, setTags] = useState([]);
  useEffect(() => {
    fetch('/api/inventory/tags')
      .then((r) => r.json())
      .then(setTags)
      .catch(() => {});
  }, []);
  return tags;
}

// Fields shown in READ mode (the collapsed detail view).
// These are only the extra details — name/type/location/status are already visible in the row.
const ITEM_FIELDS = [
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity' },
  { key: 'condition',  label: 'Condition' },
  { key: 'checkOutBy', label: 'Last Checked Out By' },
  { key: 'tags',       label: 'Tags' },
  { key: 'notes',      label: 'Notes' },
  { key: 'itemImage',  label: 'Image' },
];

// Fields shown in EDIT mode — includes the summary row fields (name, type, etc.)
// because the user should be able to change everything, not just the expanded details.
// Each field descriptor can have:
//   required  — shows a "*" and blocks save if empty
//   options   — renders a <select> with fixed choices (value stored, label displayed)
//   numeric   — renders <input type="number"> and ensures the value is sent as a number
//   multiline — renders a <textarea> instead of a single-line input
//   datalist  — renders an <input> with an autocomplete suggestion list
//   showWhen  — a function that receives the current form state and hides the field when false
const EDIT_FIELDS = [
  { key: 'name',       label: 'Name',           required: true },
  { key: 'type',       label: 'Type',           required: true, options: [
    { value: 'tool',      label: 'Tool' },
    { value: 'part',      label: 'Part' },
    { value: 'material',  label: 'Material' },
  ]},
  { key: 'location',   label: 'Location',       required: true },
  { key: 'status',     label: 'Status',         required: true, options: [
    { value: 'available',    label: 'Available' },
    { value: 'checked-out',  label: 'Checked out' },
    { value: 'maintenance',  label: 'Maintenance' },
    { value: 'missing',      label: 'Missing' },
  ]},
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity', numeric: true },
  { key: 'condition',  label: 'Condition',      options: [
    { value: '',      label: 'Select…' },
    { value: 'new',   label: 'New' },
    { value: 'good',  label: 'Good' },
    { value: 'fair',  label: 'Fair' },
    { value: 'poor',  label: 'Poor' },
  ]},
  // Only shown when status is "checked-out"
  { key: 'checkOutBy', label: 'Checked out by', datalist: true, showWhen: (f) => f.status === 'checked-out' },
  { key: 'tags',       label: 'Tags', datalist: true },
  { key: 'notes',      label: 'Notes',          multiline: true },
  { key: 'itemImage',  label: 'Image' },
];

// Shown in place of empty/null field values in read mode.
const FALLBACK = 'Not specified';

function ExpandedPanel({ item, isEditing, onEditingChange, onItemUpdate }) {
  // `form` holds the current values of every input while the user is editing.
  const [form, setForm] = useState({ ...item });
  const subteams = useSubteams();
  const tagSuggestions = useTags();
  // `errors` maps field keys to per-field error messages shown below each input.
  const [errors, setErrors] = useState({});
  // `saveError` holds a message to show when the PATCH request itself fails.
  const [saveError, setSaveError] = useState(null);
  // `restockError` holds a message to show when the restock toggle PATCH fails.
  const [restockError, setRestockError] = useState(null);

  // Every time the user opens edit mode, reset the form to the current item values.
  useEffect(() => {
    if (isEditing) {
      setForm({ ...item });
      setErrors({});
      setSaveError(null);
    }
  }, [isEditing]);

  // Update one field in form state and clear its error (so the red message disappears
  // as soon as the user starts fixing the problem).
  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  // Check that all required fields are non-empty before allowing the save.
  // Returns true if valid, false if not (and populates `errors` so each bad field shows a message).
  function validate() {
    const newErrors = {};
    for (const { key, required } of EDIT_FIELDS) {
      if (required && (!form[key] || String(form[key]).trim() === '')) {
        newErrors[key] = 'Required';
      }
    }
    // Tags are optional, but each comma-separated token must be non-empty if provided.
    const tagsVal = form.tags ?? '';
    if (tagsVal.trim() && tagsVal.split(',').some(t => t.trim() === '')) {
      newErrors.tags = 'Use comma-separated words with no empty segments (e.g. "motor, battery").';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaveError(null);
    // The quantity input gives us a string (e.g. "3") but the backend requires a real number.
    // We coerce it here before sending so the server's type check passes.
    const payload = {
      ...form,
      quantity: form.quantity !== '' && form.quantity != null ? Number(form.quantity) : form.quantity,
    };
    try {
      // Send only the changed fields to the backend; it returns the full updated item.
      const updated = await patchInventory(item.id, payload);
      // Tell the inventory list to swap the old item with the updated one.
      onItemUpdate(updated);
      // Exit edit mode and return to the read view showing the new values.
      onEditingChange(false);
    } catch (err) {
      // Show the error below the form instead of crashing — the user can try again.
      setSaveError(err.message);
    }
  }

  // Discard all changes and return to read mode without touching the server.
  function handleCancel() {
    setForm({ ...item });
    setErrors({});
    setSaveError(null);
    onEditingChange(false);
  }

  // Toggle the needsRestock flag without entering edit mode.
  async function handleRestockToggle() {
    setRestockError(null);
    const newValue = item.needsRestock ? 0 : 1;
    try {
      const updated = await patchInventory(item.id, { needsRestock: newValue });
      onItemUpdate(updated);
    } catch (err) {
      setRestockError(err.message);
    }
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <tr className="expanded-panel-row">
        {/* colSpan=5 spans all columns including the new actions column. */}
        <td colSpan={5} className="expanded-panel-cell">
          <div className="expanded-panel expanded-panel--editing">
            {/* Filter out fields whose showWhen condition is false (e.g. "Checked out by"
                when status isn't "checked-out"), then render each remaining field. */}
            {EDIT_FIELDS.filter(({ showWhen }) => !showWhen || showWhen(form)).map(({ key, label, required, multiline, options, datalist, numeric }) => (
              <div key={key} className="expanded-panel__field">
                {/* htmlFor links the label to its input so clicking the label focuses the field. */}
                <label className="expanded-panel__label" htmlFor={`edit-${key}`}>
                  {label}{required && ' *'}
                </label>

                {/* Render the right input type based on the field descriptor. */}
                {options ? (
                  // Fixed-choice fields use a <select> so users can't type invalid values.
                  <select
                    id={`edit-${key}`}
                    value={form[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                  >
                    {options.map(({ value, label: optLabel }) => (
                      <option key={value} value={value}>{optLabel}</option>
                    ))}
                  </select>
                ) : multiline ? (
                  // Notes gets a <textarea> so it can hold multiple lines of text.
                  <textarea
                    id={`edit-${key}`}
                    value={form[key] ?? ''}
                    rows={3}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                ) : (
                  <>
                    <input
                      id={`edit-${key}`}
                      // numeric fields get type="number" so the browser shows a stepper and blocks letters.
                      type={numeric ? 'number' : 'text'}
                      min={numeric ? 0 : undefined}
                      // `list` links this input to the <datalist> below for autocomplete suggestions.
                      list={datalist ? `edit-${key}-list` : undefined}
                      value={form[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    {/* The <datalist> provides autocomplete suggestions without restricting free text.
                        Tags and subteams each pull from their own fetched list. */}
                    {datalist && (
                      <datalist id={`edit-${key}-list`}>
                        {(key === 'tags' ? tagSuggestions : subteams).map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}

                {/* Per-field validation message, shown only when that field has an error. */}
                {errors[key] && (
                  <span className="expanded-panel__field-error">{errors[key]}</span>
                )}
              </div>
            ))}
          </div>

          {/* Top-level error shown when the PATCH request itself fails (e.g. network error). */}
          {saveError && <p className="expanded-panel__save-error">{saveError}</p>}

          <div className="expanded-panel__actions">
            <button onClick={handleCancel}>Cancel</button>
            {/* "active" class uses the global button style that fills the button solid. */}
            <button className="active" onClick={handleSave}>Save</button>
          </div>
        </td>
      </tr>
    );
  }

  // ── Read mode ──────────────────────────────────────────────────────────────
  return (
    <tr className="expanded-panel-row">
      <td colSpan={5} className="expanded-panel-cell">
        <div className="expanded-panel">
          {ITEM_FIELDS.map(({ key, label }) => {
            const isEmpty = item[key] == null || item[key] === '';
            return (
              <div key={key} className="expanded-panel__field">
                <span className="expanded-panel__label">{label}</span>
                {/* Apply a muted italic style when the value is empty so it's clearly a placeholder. */}
                <span className={`expanded-panel__value${isEmpty ? ' expanded-panel__value--empty' : ''}`}>
                  {isEmpty ? FALLBACK : String(item[key])}
                </span>
              </div>
            );
          })}
        </div>

        {/* Restock toggle — visible in read mode without entering edit mode. */}
        <div className="expanded-panel__restock">
          <button
            role="switch"
            aria-checked={!!item.needsRestock}
            className={`restock-toggle${item.needsRestock ? ' restock-toggle--on' : ''}`}
            onClick={handleRestockToggle}
          >
            <span className="restock-toggle__track">
              <span className="restock-toggle__thumb" />
            </span>
            Needs Restock
          </button>
          {restockError && (
            <span className="expanded-panel__restock-error">{restockError}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export { ITEM_FIELDS, FALLBACK };
export default ExpandedPanel;
