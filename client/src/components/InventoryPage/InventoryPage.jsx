import { useState } from 'react';
import { filterInventory } from '../../utils/filterInventory';
import { useInventory } from '../../utils/useInventory';
import SearchBar from '../SearchBar';
import InventoryRow from './InventoryRow';
import '../../styles/InventoryPage.css';

function InventoryPage() {
  // `updateItem` reflects edits; `deleteItem` removes an item — both avoid a full re-fetch.
  const { data, loading, error, updateItem, deleteItem } = useInventory();
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedId, setExpandedId]     = useState(null);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error.message}</p>;

  const filteredData = filterInventory(data, searchQuery);

  function handleToggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="inventory-page">
      <h2>Inventory</h2>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {data.length === 0 ? (
        <p className="empty-state">The inventory database is empty.</p>
      ) : searchQuery && filteredData.length === 0 ? (
        <p className="empty-state">No items found for "{searchQuery}"</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              {/* The empty string at the end reserves the 5th column for the three-dot actions button. */}
              {['Name', 'Type', 'Location', 'Status', ''].map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <InventoryRow
                key={item.id}
                item={item}
                isOpen={expandedId === item.id}
                onToggle={() => handleToggle(item.id)}
                onItemUpdate={updateItem}
                // Pass `deleteItem` down so InventoryRow can remove the item after a delete.
                onDelete={deleteItem}
                className={i % 2 === 0 ? '' : 'row-shaded'}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryPage;
