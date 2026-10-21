const BASE = import.meta.env.VITE_API_BASE ?? '';

// Reads the server's JSON error body and returns its `error` field.
// Falls back to `fallback` if the body is missing or unparseable.
async function serverError(response, fallback) {
  try {
    const body = await response.json();
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

// Fetches the full inventory list from the server.
export async function fetchInventory() {
  const response = await fetch(`${BASE}/api/inventory`);
  if (!response.ok) throw new Error(await serverError(response, 'Failed to fetch inventory'));
  return response.json();
}

// Sends a partial update for one inventory item to the server.
// PATCH (vs PUT) means we only send the fields we want to change, not the whole item.
// `id` identifies which row to update; `fields` is an object of just the changed values.
export async function patchInventory(id, fields) {
  const response = await fetch(`${BASE}/api/inventory/${id}`, {
    method: 'PATCH',
    // Tell the server we're sending JSON, not a form or plain text.
    headers: { 'Content-Type': 'application/json' },
    // Convert the JS object to a JSON string for the request body.
    body: JSON.stringify(fields),
  });
  // If the server responded with an error status (4xx/5xx), surface it as a thrown error
  // so callers can catch it and show a message to the user.
  if (!response.ok) throw new Error(await serverError(response, 'Failed to update inventory item'));
  return response.json();
}

// Permanently removes one inventory item from the database.
export async function deleteInventory(id) {
  const response = await fetch(`${BASE}/api/inventory/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(await serverError(response, 'Failed to delete inventory item'));
  return response.json();
}

// ─── Areas & locations ───────────────────────────────────────────────────────

// Sends a JSON request and returns the parsed response, throwing the server's error message on failure.
async function sendJson(method, path, body, fallback) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await serverError(response, fallback));
  return response.json();
}

// Returns { areas: [{ id, name }], locations: [{ id, name, areaId, itemCount }] }.
// A location with areaId null hasn't been assigned to an area yet.
export async function fetchLocations() {
  const response = await fetch(`${BASE}/api/locations`);
  if (!response.ok) throw new Error(await serverError(response, 'Failed to fetch locations'));
  return response.json();
}

export function createArea(name) {
  return sendJson('POST', '/api/areas', { name }, 'Failed to create area');
}

export function renameArea(id, name) {
  return sendJson('PATCH', `/api/areas/${id}`, { name }, 'Failed to rename area');
}

// The area's locations are kept and become unassigned.
export function deleteArea(id) {
  return sendJson('DELETE', `/api/areas/${id}`, undefined, 'Failed to delete area');
}

export function createLocation(name, areaId) {
  return sendJson('POST', '/api/locations', { name, areaId }, 'Failed to create location');
}

// `fields` may hold `name` (also renames it on every item) and/or `areaId` (null = unassigned).
export function updateLocation(id, fields) {
  return sendJson('PATCH', `/api/locations/${id}`, fields, 'Failed to update location');
}

// Only works for locations with no items; the server refuses otherwise.
export function deleteLocation(id) {
  return sendJson('DELETE', `/api/locations/${id}`, undefined, 'Failed to delete location');
}
