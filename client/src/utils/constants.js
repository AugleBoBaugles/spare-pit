// Shared option lists used across ExpandedPanel and AddItemPage.
// Keeping them in one place means adding a new type/status/condition
// only requires a change here.

export const ITEM_TYPES = [
  { value: 'tool',     label: 'Tool' },
  { value: 'part',     label: 'Part' },
  { value: 'material', label: 'Material' },
];

export const ITEM_STATUSES = [
  { value: 'available',   label: 'Available' },
  { value: 'checked-out', label: 'Checked out' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'missing',     label: 'Missing' },
];

export const ITEM_CONDITIONS = [
  { value: '',     label: 'Select…' },
  { value: 'new',  label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];
