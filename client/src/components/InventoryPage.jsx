import { useInventory } from '../hooks/useInventory';
import '../styles/InventoryPage.css';

function InventoryPage() {
  const { data, loading, error } = useInventory();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="inventory-page">
      <h2>Inventory</h2>
      <table className="inventory-table">
        <thead>
          <tr>
            {['Name', 'Type', 'Location', 'Status'].map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? '' : 'row-shaded'}>
              <td className="col-name">{item.name}</td>
              <td className="col-muted capitalize">{item.type}</td>
              <td className="col-muted">{item.location}</td>
              <td>
                <span className={`status-pill status-${item.status}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryPage;