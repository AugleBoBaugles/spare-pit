import { useEffect, useState } from 'react';
import { fetchInventory } from '../lib/api';

export function useInventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the inventory once when the page first loads.
  useEffect(() => {
    fetchInventory()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // After a successful PATCH, swap the old item out of local state with the updated one.
  // This avoids a full page re-fetch — the list updates instantly without a loading flash.
  function updateItem(updatedItem) {
    setData((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  }

  return { data, loading, error, updateItem };
}
