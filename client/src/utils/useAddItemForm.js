// Form state, validation, and submission logic for the inline "Add item" row.
import { useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE ?? '';
import { useSubteams } from './useSubteams';
import { useTags } from './useTags';

const INITIAL_FORM = {
  name: '', type: '', status: 'available', checkOutBy: '',
  area: '', location: '', quantity: 1, condition: '',
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

  function validate() {
    const next = {};
    if (!form.name.trim())                              next.name     = 'Item name is required.';
    if (!form.type)                                     next.type     = 'Type is required.';
    if (!form.status)                                   next.status   = 'Status is required.';
    if (!form.location.trim())                          next.location = 'Location is required.';
    if (form.quantity === '' || form.quantity === null) next.quantity = 'Quantity is required.';
    if (form.tags.trim() && form.tags.split(',').some(t => t.trim() === '')) {
      next.tags = 'Tags must be comma-separated words with no empty segments (e.g. "motor, battery").';
    }
    return next;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: undefined }));
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

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      checkOutBy: form.status === 'checked-out' ? form.checkOutBy || null : null,
    };

    setSubmitting(true);
    try {
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
    subteams, tagSuggestions,
    handleChange, handleImageChange, clearImage, handleSubmit, reset,
  };
}
