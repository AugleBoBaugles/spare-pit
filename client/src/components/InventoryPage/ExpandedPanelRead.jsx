// Read-mode view of an inventory item's expanded details.
// Shown when a row is expanded but not being edited.

// Fields shown in read mode — the extra details not visible in the summary row.
// (name, type, location, status are already shown in the row itself.)
export const ITEM_FIELDS = [
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity' },
  { key: 'condition',  label: 'Condition' },
  { key: 'checkOutBy', label: 'Last Checked Out By' },
  { key: 'tags',       label: 'Tags' },
  { key: 'notes',      label: 'Notes' },
  { key: 'itemImage',  label: 'Image' },
];

// Shown in place of empty/null field values.
export const FALLBACK = 'Not specified';

function ExpandedPanelRead({ item, onRestockToggle, restockError }) {
  return (
    <tr className="expanded-panel-row">
      <td colSpan={5} className="expanded-panel-cell">
        <div className="expanded-panel">
          {ITEM_FIELDS.map(({ key, label }) => {
            const isEmpty = item[key] == null || item[key] === '';
            return (
              <div key={key} className="expanded-panel__field">
                <span className="expanded-panel__label">{label}</span>
                {/* Muted italic style when the value is empty so it reads clearly as a placeholder */}
                <span className={`expanded-panel__value${isEmpty ? ' expanded-panel__value--empty' : ''}`}>
                  {isEmpty ? FALLBACK : String(item[key])}
                </span>
              </div>
            );
          })}
        </div>

        {/* Restock toggle — available in read mode without entering full edit mode */}
        <div className="expanded-panel__restock">
          <button
            role="switch"
            aria-checked={!!item.needsRestock}
            className={`restock-toggle${item.needsRestock ? ' restock-toggle--on' : ''}`}
            onClick={onRestockToggle}
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

export default ExpandedPanelRead;
