// Fetches the full inventory list from the server.
export async function fetchInventory() {
  const response = await fetch('/api/inventory');
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}

// Sends a partial update for one inventory item to the server.
// PATCH (vs PUT) means we only send the fields we want to change, not the whole item.
// `id` identifies which row to update; `fields` is an object of just the changed values.
export async function patchInventory(id, fields) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'PATCH',
    // Tell the server we're sending JSON, not a form or plain text.
    headers: { 'Content-Type': 'application/json' },
    // Convert the JS object to a JSON string for the request body.
    body: JSON.stringify(fields),
  });
  // If the server responded with an error status (4xx/5xx), surface it as a thrown error
  // so callers can catch it and show a message to the user.
  if (!response.ok) throw new Error('Failed to update inventory item');
  return response.json();
}
