import { sortInventory } from '../utils/sortInventory';

const mockItems = [
  { id: 1, name: 'multimeter',    type: 'tool',     location: 'Electronics Bench', status: 'missing' },
  { id: 2, name: 'Cordless Drill', type: 'tool',     location: null,                status: 'available' },
  { id: 3, name: 'Motor 10',       type: 'part',     location: 'Bin 4',             status: 'checked-out' },
  { id: 4, name: 'Motor 2',        type: 'part',     location: 'Bin 3',             status: 'maintenance' },
  { id: 5, name: 'Plywood Sheet',  type: 'material', location: '',                  status: 'available' },
];

const ids = (items) => items.map(item => item.id);

describe('sortInventory', () => {
  test('sorts by name A→Z, ignoring case', () => {
    expect(ids(sortInventory(mockItems, 'name', 'asc'))).toEqual([2, 4, 3, 1, 5]);
  });

  test('sorts by name Z→A', () => {
    expect(ids(sortInventory(mockItems, 'name', 'desc'))).toEqual([5, 1, 3, 4, 2]);
  });

  test('sorts numbers inside text naturally ("Motor 2" before "Motor 10")', () => {
    const result = sortInventory(mockItems, 'name', 'asc').map(item => item.name);
    expect(result.indexOf('Motor 2')).toBeLessThan(result.indexOf('Motor 10'));
  });

  test('sorts status in workflow order, not alphabetically', () => {
    // available (2, 5 — tie broken by name) → checked-out → maintenance → missing
    expect(ids(sortInventory(mockItems, 'status', 'asc'))).toEqual([2, 5, 3, 4, 1]);
  });

  test('reverses status order when descending', () => {
    expect(ids(sortInventory(mockItems, 'status', 'desc'))).toEqual([1, 4, 3, 2, 5]);
  });

  test('puts unknown statuses after known ones', () => {
    const items = [...mockItems, { id: 6, name: 'Saw', status: 'retired' }];
    expect(ids(sortInventory(items, 'status', 'asc')).at(-1)).toBe(6);
  });

  test('puts blank values last in both directions', () => {
    expect(ids(sortInventory(mockItems, 'location', 'asc')).slice(-2)).toEqual([2, 5]);
    expect(ids(sortInventory(mockItems, 'location', 'desc')).slice(-2)).toEqual([2, 5]);
  });

  test('breaks ties by name', () => {
    // Both tools; Cordless Drill comes before multimeter
    expect(ids(sortInventory(mockItems, 'type', 'asc'))).toEqual([5, 4, 3, 2, 1]);
  });

  test('does not mutate the input array', () => {
    const copy = [...mockItems];
    sortInventory(mockItems, 'name', 'desc');
    expect(mockItems).toEqual(copy);
  });
});
