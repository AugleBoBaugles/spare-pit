import { filterInventory } from '../utils/filterInventory';

const mockItems = [
  { id: 1, name: 'Cordless Drill', type: 'tool', location: 'Tool Cabinet A', status: 'available' },
  { id: 2, name: 'Multimeter',     type: 'tool', location: 'Electronics Bench', status: 'in-use' },
  { id: 3, name: 'Plywood Sheet',  type: 'material', location: 'Lumber Rack', status: 'available' },
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