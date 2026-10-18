import { ITEM_STATUSES } from './constants';

// Status sorts in workflow order (available → checked out → maintenance → missing) rather
// than alphabetically. The order comes from ITEM_STATUSES so adding a status only needs
// a change in constants.js.
const STATUS_RANK = Object.fromEntries(ITEM_STATUSES.map(({ value }, i) => [value, i]));

// Case-insensitive and number-aware, so "Motor 2" sorts before "Motor 10".
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function compareField(a, b, field) {
  if (field === 'status') {
    // Unknown statuses go after the known ones, alphabetically among themselves.
    const rankA = STATUS_RANK[a.toLowerCase()] ?? ITEM_STATUSES.length;
    const rankB = STATUS_RANK[b.toLowerCase()] ?? ITEM_STATUSES.length;
    if (rankA !== rankB) return rankA - rankB;
  }
  return collator.compare(String(a), String(b));
}

/*
 * Returns a new array of items sorted by `field` in `direction` ('asc' or 'desc').
 * Items with a blank value always go last, whichever direction is chosen.
 * Ties are broken by name so the order stays stable as items are edited.
 */
export function sortInventory(items, field, direction = 'asc') {
  const sign = direction === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const valueA = a[field];
    const valueB = b[field];
    const blankA = isBlank(valueA);
    const blankB = isBlank(valueB);

    if (blankA !== blankB) return blankA ? 1 : -1;
    if (!blankA) {
      const result = compareField(valueA, valueB, field);
      if (result !== 0) return sign * result;
    }
    return field === 'name' ? 0 : collator.compare(a.name ?? '', b.name ?? '');
  });
}
