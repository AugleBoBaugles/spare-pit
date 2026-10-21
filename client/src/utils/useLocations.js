// Fetches every area and location from the server, plus helpers for the Area → Location
// picker used by the item forms.
// Used by the Locations page (which edits them via setAreas / setLocations) and by the
// item forms (LocationFields). Fetch failures are kept in `error`; the forms ignore them.
import { useEffect, useState } from 'react';
import { createLocation, fetchLocations } from '../lib/api';

export function useLocations() {
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations()
      .then((data) => {
        setAreas(Array.isArray(data?.areas) ? data.areas : []);
        setLocations(Array.isArray(data?.locations) ? data.locations : []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { areas, setAreas, locations, setLocations, loading, error };
}

// ─── Area → Location picker ──────────────────────────────────────────────────
// The picker's Area select holds an "area key": '' for no location at all,
// UNASSIGNED for locations that aren't in an area yet, or an area id as a string.

export const UNASSIGNED = 'unassigned';

// The area key an existing item's location sits under.
export function areaKeyFor(item) {
  if (item.locationId == null) return '';
  return item.areaId == null ? UNASSIGNED : String(item.areaId);
}

function areaIdFor(areaKey) {
  return areaKey === UNASSIGNED ? null : Number(areaKey);
}

// The locations listed under an area key.
export function locationsInArea(locations, areaKey) {
  if (!areaKey) return [];
  const areaId = areaIdFor(areaKey);
  return locations.filter((l) => (l.areaId ?? null) === areaId);
}

// The location with this name (ignoring case and spaces) under the area key, or undefined.
export function findLocationInArea(locations, areaKey, name) {
  const key = (name ?? '').trim().toLowerCase();
  if (!key) return undefined;
  return locationsInArea(locations, areaKey).find((l) => l.name.toLowerCase() === key);
}

// Validation message for the picker, or null when it's fine. An area with no location
// isn't allowed — there's nothing to store it against.
export function locationError(areaKey, locationName) {
  if (areaKey && !(locationName ?? '').trim()) return 'Pick or type a location in this area, or set Area to “None”.';
  return null;
}

// Turns the picker's values into the locationId to save, creating the location first
// when the typed name is new. Returns { locationId, created } — `created` is the new
// location (to add to local state) or null.
export async function resolveLocationId(areaKey, locationName, locations) {
  if (!areaKey) return { locationId: null, created: null };
  const existing = findLocationInArea(locations, areaKey, locationName);
  if (existing) return { locationId: existing.id, created: null };
  const created = await createLocation(locationName.trim(), areaIdFor(areaKey));
  return { locationId: created.id, created };
}
