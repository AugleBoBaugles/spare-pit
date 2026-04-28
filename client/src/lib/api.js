export async function fetchInventory() {
  const response = await fetch('/api/inventory');
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}