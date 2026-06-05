import { filterInventory } from '../utils/filterInventory';

const mockItems = [
  { id: 1, name: 'Cordless Drill', type: 'tool', location: 'Tool Cabinet A', status: 'available', tags: 'power, drilling' },
  { id: 2, name: 'Multimeter',     type: 'tool', location: 'Electronics Bench', status: 'in-use', tags: 'electronics, testing' },
  { id: 3, name: 'Plywood Sheet',  type: 'material', location: 'Lumber Rack', status: 'available', tags: null },
];

describe('filterInventory', () => {
  test('exact match on name', () => {
    const result = filterInventory(mockItems, 'Multimeter');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('case-insensitive match', () => {
    const result = filterInventory(mockItems, 'cordless drill');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('partial match on name', () => {
    const result = filterInventory(mockItems, 'drill');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('match on type field', () => {
    const result = filterInventory(mockItems, 'material');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('match on status field', () => {
    const result = filterInventory(mockItems, 'in-use');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('match on location field', () => {
    const result = filterInventory(mockItems, 'Lumber Rack');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('no match returns empty array', () => {
    const result = filterInventory(mockItems, 'xxxxxxx');
    expect(result).toHaveLength(0);
  });

  test('empty query returns full list', () => {
    expect(filterInventory(mockItems, '')).toHaveLength(3);
    expect(filterInventory(mockItems, '   ')).toHaveLength(3);
    expect(filterInventory(mockItems, null)).toHaveLength(3);
    expect(filterInventory(mockItems, undefined)).toHaveLength(3);
  });
});

describe('filterInventory — tag filter', () => {
  test('single tag returns only items that have that tag', () => {
    const result = filterInventory(mockItems, '', ['power']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('tag match is case-insensitive', () => {
    const result = filterInventory(mockItems, '', ['POWER']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('AND logic: multiple tags must all be present', () => {
    // Only item 1 has both "power" and "drilling"
    const result = filterInventory(mockItems, '', ['power', 'drilling']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('AND logic: no item has all selected tags — returns empty', () => {
    // No item has both "power" and "electronics"
    const result = filterInventory(mockItems, '', ['power', 'electronics']);
    expect(result).toHaveLength(0);
  });

  test('item with no tags is excluded when any tag is active', () => {
    // Item 3 has tags: null — should never appear when a tag filter is active
    const result = filterInventory(mockItems, '', ['power']);
    expect(result.find(i => i.id === 3)).toBeUndefined();
  });

  test('no active tags returns all items (passthrough)', () => {
    expect(filterInventory(mockItems, '', [])).toHaveLength(3);
    expect(filterInventory(mockItems, '')).toHaveLength(3);
  });

  test('text query and tag filter are applied together', () => {
    // "tool" matches items 1 and 2 by type; only item 1 has the "power" tag
    const result = filterInventory(mockItems, 'tool', ['power']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});