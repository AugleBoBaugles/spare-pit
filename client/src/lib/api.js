export async function fetchInventory() {
  const response = await fetch('/api/inventory');
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}

export async function patchInventory(id, fields) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!response.ok) throw new Error('Failed to update inventory item');
  return response.json();
}