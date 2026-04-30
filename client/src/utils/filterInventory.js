export function filterInventory(items, query) {
  if (!query || query.trim() === '') return items;

  const normalized = query.toLowerCase().trim();

  return items.filter(item =>
    [item.name, item.type, item.location, item.status]
      .some(field => field.toLowerCase().includes(normalized))
  );
}