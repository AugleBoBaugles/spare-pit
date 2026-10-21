// Small inline text field for naming or renaming an area or location.
// Enter (or clicking away) saves, Escape cancels. Saving with an empty or unchanged
// name just cancels. If `onSubmit` returns false (the save failed), the field stays
// open so the user can fix the name.
import { useRef, useState } from 'react';

function NameInput({ initial = '', label, placeholder, onSubmit, onCancel, className = '' }) {
  const [value, setValue] = useState(initial);
  // Guards against saving twice — Enter followed by the blur when the field disappears.
  const busy = useRef(false);

  async function submit() {
    if (busy.current) return;
    const name = value.trim();
    if (!name || name === initial) { onCancel(); return; }
    busy.current = true;
    const ok = await onSubmit(name);
    busy.current = false;
    if (ok === false) setValue(name);
  }

  return (
    <form
      className={`name-input ${className}`}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <input
        type="text"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }}
        // Typing in a draggable card would otherwise start a drag on text selection.
        onDragStart={(e) => e.preventDefault()}
        autoFocus
        autoComplete="off"
      />
    </form>
  );
}

export default NameInput;
