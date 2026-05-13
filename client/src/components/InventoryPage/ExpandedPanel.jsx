// Renders the expanded detail panel for an inventory item.
const ITEM_FIELDS = [
  { key: 'area',       label: 'Area' },
  { key: 'quantity',   label: 'Quantity' },
  { key: 'condition',  label: 'Condition' },
  { key: 'checkOutBy', label: 'Checked out by' },
  { key: 'tags',       label: 'Tags' },
  { key: 'notes',      label: 'Notes' },
  { key: 'itemImage',  label: 'Image' },
];

const FALLBACK = 'Not specified';

function ExpandedPanel({ item }) {
  return (
    <tr className="expanded-panel-row">
      <td colSpan={4} className="expanded-panel-cell">
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