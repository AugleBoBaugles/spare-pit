// Splits a tags string ("motor, battery") into a lowercase trimmed set.
function parseTags(tagsStr) {
  if (!tagsStr) return new Set();
  return new Set(
    tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  );
}

/*
 * Filters inventory items by text query AND an optional array of active tags.
 * Text search is a case-insensitive substring match across name/type/location/status.
 * Tag filter is AND logic: every active tag must appear in the item's tags field.
 * Either filter can be omitted independently.
 */
export function filterInventory(items, query, activeTags = []) {
  let result = items;

  if (query && query.trim() !== '') {
    const normalized = query.toLowerCase().trim();
    result = result.filter(item =>
      [item.name, item.type, item.location, item.status]
        .some(field => field && field.toLowerCase().includes(normalized))
    );
  }

  if (activeTags.length > 0) {
    result = result.filter(item => {
      const itemTags = parseTags(item.tags);
      // Every selected tag must be present in the item's tag set.
      return activeTags.every(tag => itemTags.has(tag.toLowerCase()));
    });
  }

  return result;
}