// A single inventory table row. Renders a summary row and, when open, the ExpandedPanel beneath it.
import ExpandedPanel from './ExpandedPanel';

function getStatusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'missing')   return 'status-missing';
  return 'status-in-use';
}

function InventoryRow({ item, isOpen, onToggle }) {
  return (
    <>
      <tr
        className={`inventory-row ${isOpen ? 'inventory-row--expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
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
      </tr>

      {isOpen && <ExpandedPanel item={item} />}
    </>
  );
}

export default InventoryRow;