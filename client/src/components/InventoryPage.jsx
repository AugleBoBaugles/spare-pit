import { useState } from 'react';
import { filterInventory } from '../utils/filterInventory';
import { useInventory } from '../utils/useInventory';
import SearchBar from './SearchBar';
import '../styles/InventoryPage.css';


function getStatusClass(status) {
  if (status === 'available') return 'status-available';
  if (status === 'missing') return 'status-missing';
  return 'status-in-use'; // checked-out, maintenance, and anything new
}

function InventoryPage() {
  const { data, loading, error } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const filteredData = filterInventory(data, searchQuery);

  return (
    <div className="inventory-page">
      <h2>Inventory</h2>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {searchQuery && filteredData.length === 0 ? (
        <p className="empty-state">No items found for "{searchQuery}"</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              {['Name', 'Type', 'Location', 'Status'].map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? '' : 'row-shaded'}>
                <td className="col-name">{item.name}</td>
                <td className="col-muted capitalize">{item.type}</td>
                <td className="col-muted">{item.location}</td>
                <td>
                  <span className={`status-pill ${getStatusClass(item.status)}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryPage;