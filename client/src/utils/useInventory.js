import { useEffect, useState } from 'react';
import { fetchInventory } from '../lib/api';

export function useInventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventory()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  function updateItem(updatedItem) {
    setData((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  }

  return { data, loading, error, updateItem };
}