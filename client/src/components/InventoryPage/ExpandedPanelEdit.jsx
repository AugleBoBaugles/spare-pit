// Edit-mode form for an inventory item. Receives all state and handlers from ExpandedPanel.
import { ITEM_TYPES, ITEM_STATUSES, ITEM_CONDITIONS } from '../../utils/constants';

// Fields rendered in edit mode — includes summary row fields (name, type, etc.)
// so the user can change everything, not just the expanded details.
//
// Field descriptor properties:
//   required  — shows a "*" and blocks save if empty
//   options   — renders a <select> with fixed choices
//   numeric   — renders <input type="number">
//   multiline — renders a <textarea>
//   datalist  — renders an <input> with autocomplete suggestions
//   showWhen  — function(formState) => bool; field is hidden when false
export const EDIT_FIELDS = [
  { key: 'name',       label: 'Name',          required: true },
  { key: 'type',       label: 'Type',          required: true, options: ITEM_TYPES },
  { key: 'location',   label: 'Location',      required: true },
  { key: 'status',     label: 'Status',        required: true, options: ITEM_STATUSES },
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity',       numeric: true },
  { key: 'condition',  label: 'Condition',      options: ITEM_CONDITIONS },
  { key: 'checkOutBy', label: 'Checked out by', datalist: true, showWhen: (f) => f.status === 'checked-out' },
  { key: 'tags',       label: 'Tags',           datalist: true },
  { key: 'notes',      label: 'Notes',          multiline: true },
  { key: 'itemImage',  label: 'Image' },
];

function ExpandedPanelEdit({ form, errors, saveError, onChange, onSave, onCancel, subteams, tagSuggestions }) {
  return (
    <tr className="expanded-panel-row">
      {/* colSpan=5 spans all columns including the actions column */}
      <td colSpan={5} className="expanded-panel-cell">
        <div className="expanded-panel expanded-panel--editing">
          {/* Filter out fields whose showWhen condition is false, then render each field. */}
          {EDIT_FIELDS.filter(({ showWhen }) => !showWhen || showWhen(form)).map(
            ({ key, label, required, multiline, options, datalist, numeric }) => (
              <div key={key} className="expanded-panel__field">
                {/* htmlFor links the label to its input so clicking the label focuses the field */}
                <label className="expanded-panel__label" htmlFor={`edit-${key}`}>
                  {label}{required && ' *'}
                </label>

                {options ? (
                  // Fixed-choice fields use a <select> so users can't type invalid values.
                  <select
                    id={`edit-${key}`}
                    value={form[key] ?? ''}
                    onChange={(e) => onChange(key, e.target.value)}
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
                    onChange={(e) => onChange(key, e.target.value)}
                  />
                ) : (
                  <>
                    <input
                      id={`edit-${key}`}
                      type={numeric ? 'number' : 'text'}
                      min={numeric ? 0 : undefined}
                      list={datalist ? `edit-${key}-list` : undefined}
                      value={form[key] ?? ''}
                      onChange={(e) => onChange(key, e.target.value)}
                    />
                    {/* <datalist> provides suggestions without restricting free text input */}
                    {datalist && (
                      <datalist id={`edit-${key}-list`}>
                        {(key === 'tags' ? tagSuggestions : subteams).map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}

                {errors[key] && (
                  <span className="expanded-panel__field-error">{errors[key]}</span>
                )}
              </div>
            )
          )}
        </div>

        {/* Shown when the PATCH request itself fails (e.g. network error) */}
        {saveError && <p className="expanded-panel__save-error">{saveError}</p>}

        <div className="expanded-panel__actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="active" onClick={onSave}>Save</button>
        </div>
      </td>
    </tr>
  );
}

export default ExpandedPanelEdit;
