// Form state, validation, and submission logic for the inline "Add item" row.
import { useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE ?? '';
import { useSubteams } from './useSubteams';
import { useTags } from './useTags';
import { useLocations, locationError, resolveLocationId } from './useLocations';

// `areaKey` and `locationName` are the Area → Location picker (see LocationFields);
// both empty means the item has no location, which is the default.
const INITIAL_FORM = {
  name: '', type: '', status: 'available', checkOutBy: '',
  areaKey: '', locationName: '', quantity: 1, condition: '',
  tags: '', notes: '', itemImage: '',
};

// `onCreated(item, possibleDuplicate)` is called after a successful POST with the new item.
// The form then resets itself, carrying over the fields named in `keepAfterSubmit`.
export function useAddItemForm(onCreated, { keepAfterSubmit = [] } = {}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const subteams = useSubteams();
  const tagSuggestions = useTags();
  const { areas, locations, setLocations } = useLocations();

  function validate() {
    const next = {};
    if (!form.name.trim())                              next.name     = 'Item name is required.';
    if (!form.type)                                     next.type     = 'Type is required.';
    if (!form.status)                                   next.status   = 'Status is required.';
    const locError = locationError(form.areaKey, form.locationName);
    if (locError)                                       next.location = locError;
    if (form.quantity === '' || form.quantity === null) next.quantity = 'Quantity is required.';
    if (form.tags.trim() && form.tags.split(',').some(t => t.trim() === '')) {
      next.tags = 'Tags must be comma-separated words with no empty segments (e.g. "motor, battery").';
    }
    return next;
  }

  function handleChange(e) {
    setField(e.target.name, e.target.value);
  }

  // Sets one field and clears its error. The two picker fields share the `location` error.
  function setField(name, value) {
    const errorKey = name === 'areaKey' || name === 'locationName' ? 'location' : name;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [errorKey]: undefined }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, itemImage: `images/${file.name}` }));
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setForm(f => ({ ...f, itemImage: '' }));
    setImagePreview(null);
  }

  // Clears the form. `keep` lists field names whose current values should carry over
  // (e.g. location, so several items in the same spot can be entered quickly).
  function reset(keep = []) {
    setForm(f => {
      const next = { ...INITIAL_FORM };
      for (const key of keep) next[key] = f[key];
      return next;
    });
    setErrors({});
    setImagePreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) { setErrors(next); return; }

    const { areaKey, locationName, ...fields } = form;

    setSubmitting(true);

    // A location name that's new in its area is created first, so the item can point at it.
    let locationId;
    try {
      const resolved = await resolveLocationId(areaKey, locationName, locations);
      locationId = resolved.locationId;
      if (resolved.created) setLocations((prev) => [...prev, resolved.created]);
    } catch (err) {
      setErrors({ submit: err.message });
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...fields,
        locationId,
        quantity: Number(form.quantity),
        checkOutBy: form.status === 'checked-out' ? form.checkOutBy || null : null,
      };
      const res = await fetch(`${BASE}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setErrors({ submit: error || 'Something went wrong.' });
        return;
      }

      const { possibleDuplicate, ...item } = await res.json();
      reset(keepAfterSubmit);
      onCreated(item, possibleDuplicate);
    } catch {
      setErrors({ submit: 'Network error — please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form, errors, submitting, imagePreview,
    subteams, tagSuggestions, areas, locations,
    handleChange, setField, handleImageChange, clearImage, handleSubmit, reset,
  };
}
