// Renders the expanded detail panel for an inventory item, in read or edit mode.
import { useEffect, useState } from 'react';
import { patchInventory } from '../../lib/api';

function useSubteams() {
  const [subteams, setSubteams] = useState([]);
  useEffect(() => {
    fetch('/api/inventory/subteams')
      .then((r) => r.json())
      .then(setSubteams)
      .catch(() => {});
  }, []);
  return subteams;
}

const ITEM_FIELDS = [
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity' },
  { key: 'condition',  label: 'Condition' },
  { key: 'checkOutBy', label: 'Checked out by' },
  { key: 'tags',       label: 'Tags' },
  { key: 'notes',      label: 'Notes' },
  { key: 'itemImage',  label: 'Image' },
];

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
  { key: 'quantity',   label: 'Quantity' },
  { key: 'condition',  label: 'Condition',      options: [
    { value: '',      label: 'Select…' },
    { value: 'new',   label: 'New' },
    { value: 'good',  label: 'Good' },
    { value: 'fair',  label: 'Fair' },
    { value: 'poor',  label: 'Poor' },
  ]},
  { key: 'checkOutBy', label: 'Checked out by', datalist: true, showWhen: (f) => f.status === 'checked-out' },
  { key: 'tags',       label: 'Tags' },
  { key: 'notes',      label: 'Notes',          multiline: true },
  { key: 'itemImage',  label: 'Image' },
];
const FALLBACK = 'Not specified';

function ExpandedPanel({ item, isEditing, onEditingChange, onItemUpdate }) {
  const [form, setForm] = useState({ ...item });
  const subteams = useSubteams();
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  // Re-seed form from latest item data each time edit mode opens.
  useEffect(() => {
    if (isEditing) {
      setForm({ ...item });
      setErrors({});
      setSaveError(null);
    }
  }, [isEditing]);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validate() {
    const newErrors = {};
    for (const { key, required } of EDIT_FIELDS) {
      if (required && (!form[key] || String(form[key]).trim() === '')) {
        newErrors[key] = 'Required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaveError(null);
    try {
      const updated = await patchInventory(item.id, form);
      onItemUpdate(updated);
      onEditingChange(false);
    } catch (err) {
      setSaveError(err.message);
    }
  }

  function handleCancel() {
    setForm({ ...item });
    setErrors({});
    setSaveError(null);
    onEditingChange(false);
  }

  if (isEditing) {
    return (
      <tr className="expanded-panel-row">
        <td colSpan={5} className="expanded-panel-cell">
          <div className="expanded-panel expanded-panel--editing">
            {EDIT_FIELDS.filter(({ showWhen }) => !showWhen || showWhen(form)).map(({ key, label, required, multiline, options, datalist }) => (
              <div key={key} className="expanded-panel__field">
                <label className="expanded-panel__label" htmlFor={`edit-${key}`}>
                  {label}{required && ' *'}
                </label>
                {options ? (
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
                      type="text"
                      list={datalist ? `edit-${key}-list` : undefined}
                      value={form[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    {datalist && (
                      <datalist id={`edit-${key}-list`}>
                        {subteams.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    )}
                  </>
                )}
                {errors[key] && (
                  <span className="expanded-panel__field-error">{errors[key]}</span>
                )}
              </div>
            ))}
          </div>
          {saveError && <p className="expanded-panel__save-error">{saveError}</p>}
          <div className="expanded-panel__actions">
            <button onClick={handleCancel}>Cancel</button>
            <button className="active" onClick={handleSave}>Save</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="expanded-panel-row">
      <td colSpan={5} className="expanded-panel-cell">
        <div className="expanded-panel">
          {ITEM_FIELDS.map(({ key, label }) => {
            const isEmpty = item[key] == null || item[key] === '';
            return (
              <div key={key} className="expanded-panel__field">
                <span className="expanded-panel__label">{label}</span>
                <span className={`expanded-panel__value${isEmpty ? ' expanded-panel__value--empty' : ''}`}>
                  {isEmpty ? FALLBACK : String(item[key])}
                </span>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

export { ITEM_FIELDS, FALLBACK };
export default ExpandedPanel;
