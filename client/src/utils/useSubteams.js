// Fetches the list of known subteam names from the server (e.g. "electrical", "programming").
// Used to populate autocomplete suggestions on the "Checked out by" field.
// Fetch failures are silently swallowed — the field still works as a plain text input.
import { useState, useEffect } from 'react';

export function useSubteams() {
  const [subteams, setSubteams] = useState([]);
  useEffect(() => {
    fetch('/api/inventory/subteams')
      .then((r) => r.json())
      .then(setSubteams)
      .catch(() => {});
  }, []);
  return subteams;
}
