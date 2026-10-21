// Coordinator for the expanded item panel. Owns all state and logic;
// delegates rendering to ExpandedPanelRead (read mode) and ExpandedPanelEdit (edit mode).
import { useEffect, useState } from 'react';
import { patchInventory } from '../../lib/api';
import { useSubteams } from '../../utils/useSubteams';
import { useTags } from '../../utils/useTags';
import { useLocations, areaKeyFor, locationError, resolveLocationId } from '../../utils/useLocations';
import ExpandedPanelRead, { ITEM_FIELDS, FALLBACK } from './ExpandedPanelRead';
import ExpandedPanelEdit, { EDIT_FIELDS } from './ExpandedPanelEdit';

// The edit form holds the item's fields plus the Area → Location picker's two values.
function formFor(item) {
  return { ...item, areaKey: areaKeyFor(item), locationName: item.location ?? '' };
}

function ExpandedPanel({ item, isEditing, onEditingChange, onItemUpdate }) {
  const [form, setForm] = useState(() => formFor(item));
  const subteams = useSubteams();
  const tagSuggestions = useTags();
  const { areas, locations } = useLocations();
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [restockError, setRestockError] = useState(null);

  // Reset the form to the current item values each time edit mode opens.
  useEffect(() => {
    if (isEditing) {
      setForm(formFor(item));
      setErrors({});
      setSaveError(null);
    }
  }, [isEditing]);

  // Update one field in form state and clear its validation error.
  // The two picker fields share the `location` error.
  function handleChange(key, value) {
    const errorKey = key === 'areaKey' || key === 'locationName' ? 'location' : key;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: null }));
  }

  // Validates required fields and tag format. Returns true if valid.
  function validate() {
    const newErrors = {};
    for (const { key, required } of EDIT_FIELDS) {
      if (required && (!form[key] || String(form[key]).trim() === '')) {
        newErrors[key] = 'Required';
      }
    }
    const locError = locationError(form.areaKey, form.locationName);
    if (locError) newErrors.location = locError;
    const tagsVal = form.tags ?? '';
    if (tagsVal.trim() && tagsVal.split(',').some(t => t.trim() === '')) {
      newErrors.tags = 'Use comma-separated words with no empty segments (e.g. "motor, battery").';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaveError(null);
    try {
      // A location name that's new in its area is created first, so the item can point at it.
      const { locationId } = await resolveLocationId(form.areaKey, form.locationName, locations);
      // The picker values and the joined location/area names aren't columns — send locationId instead.
      // eslint-disable-next-line no-unused-vars
      const { areaKey, locationName, location, area, areaId, ...fields } = form;
      // Coerce quantity to a number — the input gives us a string but the backend requires a number.
      const payload = {
        ...fields,
        locationId,
        quantity: form.quantity !== '' && form.quantity != null ? Number(form.quantity) : form.quantity,
      };
      const updated = await patchInventory(item.id, payload);
      onItemUpdate(updated);
      onEditingChange(false);
    } catch (err) {
      setSaveError(err.message);
    }
  }

  function handleCancel() {
    setForm(formFor(item));
    setErrors({});
    setSaveError(null);
    onEditingChange(false);
  }

  async function handleRestockToggle() {
    setRestockError(null);
    const newValue = item.needsRestock ? 0 : 1;
    try {
      const updated = await patchInventory(item.id, { needsRestock: newValue });
      onItemUpdate(updated);
    } catch (err) {
      setRestockError(err.message);
    }
  }

  if (isEditing) {
    return (
      <ExpandedPanelEdit
        form={form}
        errors={errors}
        saveError={saveError}
        onChange={handleChange}
        onSave={handleSave}
        onCancel={handleCancel}
        suggestions={{ tags: tagSuggestions, checkOutBy: subteams }}
        locations={locations}
        areas={areas}
      />
    );
  }

  return (
    <ExpandedPanelRead
      item={item}
      onRestockToggle={handleRestockToggle}
      restockError={restockError}
    />
  );
}

export { ITEM_FIELDS, FALLBACK };
export default ExpandedPanel;
