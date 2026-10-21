// Dashboard section listing items that have no location yet. Each one has a
// "Set location" button that opens the Area → Location picker inline; once saved,
// the item has a location and drops off the list.
import { useState } from 'react';
import { patchInventory } from '../lib/api';
import { useLocations, locationError, resolveLocationId } from '../utils/useLocations';
import LocationFields from './LocationFields';

// `items` are the items without a location; `onItemUpdate` receives each saved item.
function UnlocatedItems({ items, loading, onItemUpdate }) {
  const { areas, locations, setLocations } = useLocations();
  // The item whose picker is open, and that picker's values.
  const [placingId, setPlacingId] = useState(null);
  const [picker, setPicker] = useState({ areaKey: '', locationName: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function open(item) {
    setPlacingId(item.id);
    setPicker({ areaKey: '', locationName: '' });
    setError(null);
  }

  function handlePickerChange(key, value) {
    setPicker((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSave(item) {
    const problem = picker.areaKey
      ? locationError(picker.areaKey, picker.locationName)
      : 'Pick an area, then a location.';
    if (problem) { setError(problem); return; }

    setSaving(true);
    try {
      // A location name that's new in its area is created first, so the item can point at it.
      const { locationId, created } = await resolveLocationId(picker.areaKey, picker.locationName, locations);
      if (created) setLocations((prev) => [...prev, created]);
      onItemUpdate(await patchInventory(item.id, { locationId }));
      setPlacingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="home-unlocated">
      <p className="home-section-label">Needs a location</p>
      {loading ? null : items.length === 0 ? (
        <p className="home-empty">Every item has a location.</p>
      ) : (
        <ul className="attention-list">
          {items.map((item) => (
            <li key={item.id} className="attention-item unlocated-item">
              <span className="attention-item__name">{item.name}</span>
              {item.quantity != null && (
                <span className="restock-item__qty">Qty: {item.quantity}</span>
              )}
              {placingId === item.id ? (
                <div className="unlocated-item__form">
                  <div className="unlocated-item__fields">
                    <LocationFields
                      idPrefix={`place-${item.id}`}
                      classPrefix="unlocated-item"
                      areaKey={picker.areaKey}
                      locationName={picker.locationName}
                      onChange={handlePickerChange}
                      areas={areas}
                      locations={locations}
                      error={error}
                    />
                  </div>
                  <div className="unlocated-item__actions">
                    <button type="button" onClick={() => setPlacingId(null)}>Cancel</button>
                    <button type="button" className="active" onClick={() => handleSave(item)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="restock-item__clear" onClick={() => open(item)}>
                  Set location
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UnlocatedItems;
