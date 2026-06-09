// Fetches the deduplicated tag list from the server.
// Used to populate autocomplete suggestions on the Tags field.
// Fetch failures are silently swallowed — the field still works as a plain text input.
import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_BASE ?? '';

export function useTags() {
  const [tags, setTags] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/api/inventory/tags`)
      .then((r) => r.json())
      .then(setTags)
      .catch(() => {});
  }, []);
  return tags;
}
