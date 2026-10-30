import { useRef, useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_BASE ?? '';
import { filterInventory } from '../../utils/filterInventory';
import { sortInventory } from '../../utils/sortInventory';
import { useInventory } from '../../utils/useInventory';
import SearchBar from '../SearchBar';
import AddItemRow from './AddItemRow';
import InventoryRow from './InventoryRow';
import TagFilterDropdown from './TagFilterDropdown';
import '../../styles/InventoryPage.css';

// Sortable table columns, in display order. A 5th, unlabelled column holds the actions button.
const COLUMNS = [
  { field: 'name',     label: 'Name' },
  { field: 'quantity', label: 'Quantity' },
  { field: 'location', label: 'Location' },
  { field: 'status',   label: 'Status' },
];

// How long a newly added row stays highlighted.
const HIGHLIGHT_MS = 2000;

// `initialLocation` ({ id, name, area }) starts the list filtered to that one location —
// set when a location card is clicked on the Locations page.
function InventoryPage({ initialLocation = null }) {
  // `updateItem` reflects edits, `deleteItem` removes an item and `addItem` inserts a new one —
  // all avoid a full re-fetch.
  const { data, loading, error, updateItem, deleteItem, addItem } = useInventory();
  const [searchQuery, setSearchQuery]   = useState('');
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [expandedId, setExpandedId]     = useState(null);

  // Sort state — the list starts alphabetical by name.
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' });
  // Id of the item just added, so its row can be scrolled to and briefly highlighted.
  const [highlightedId, setHighlightedId] = useState(null);

  // Tag filter state
  const [availableTags, setAvailableTags] = useState([]);
  const [activeTags, setActiveTags]       = useState([]);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  // tagsLoaded tracks whether we've fetched from /tags yet (lazy — fetch on first open).
  const [tagsLoaded, setTagsLoaded]       = useState(false);

  // Ref on the wrapper div so we can detect clicks outside the dropdown.
  const filterRef = useRef(null);

  // Close the dropdown when the user clicks anywhere outside the filter wrapper.
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutsideClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  // Clear the new-item highlight after a moment.
  useEffect(() => {
    if (highlightedId === null) return;
    const timer = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  // Clicking the active column flips the direction; clicking a new column sorts it A→Z.
  function handleSortClick(field) {
    setSort(prev =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  }

  // The new item lands wherever the current sort puts it, so highlight it to help the user find it.
  function handleItemAdded(item) {
    addItem(item);
    setHighlightedId(item.id);
  }

  async function handleFilterButtonClick() {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }
    // Fetch tags from the server on first open only.
    if (!tagsLoaded) {
      try {
        const res = await fetch(`${BASE}/api/inventory/tags`);
        const tags = await res.json();
        setAvailableTags(tags);
        setTagsLoaded(true);
      } catch {
        // Leave availableTags empty — the dropdown will show the empty state message.
        setTagsLoaded(true);
      }
    }
    setDropdownOpen(true);
  }

  function handleTagToggle(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error.message}</p>;

  const filteredData = sortInventory(
    filterInventory(data, searchQuery, activeTags, locationFilter?.id ?? null),
    sort.field,
    sort.direction
  );

  // Count how many items carry each tag across the full (unfiltered) dataset.
  const tagCounts = {};
  for (const item of data) {
    if (!item.tags) continue;
    for (const token of item.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)) {
      tagCounts[token] = (tagCounts[token] || 0) + 1;
    }
  }

  function handleToggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filterLabel = activeTags.length > 0
    ? `Filter by tags (${activeTags.length})`
    : 'Filter by tags';

  return (
    <div className="inventory-page">
      <div className="inventory-controls">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {locationFilter && (
          <button
            type="button"
            className="location-filter-chip"
            onClick={() => setLocationFilter(null)}
            aria-label={`Clear location filter: ${locationFilter.name}`}
          >
            Location: {locationFilter.name}{locationFilter.area && ` · ${locationFilter.area}`}
            <span className="location-filter-chip__x" aria-hidden="true">✕</span>
          </button>
        )}

        {/* Tag filter button + dropdown, wrapped together so the outside-click handler works. */}
        <div className="tag-filter-wrapper" ref={filterRef}>
          <button
            className={`tag-filter-btn${activeTags.length > 0 ? ' tag-filter-btn--active' : ''}`}
            onClick={handleFilterButtonClick}
            aria-expanded={dropdownOpen}
          >
            {filterLabel}
          </button>
          {dropdownOpen && (
            <TagFilterDropdown
              tags={availableTags}
              activeTags={activeTags}
              onTagToggle={handleTagToggle}
              tagCounts={tagCounts}
            />
          )}
        </div>
      </div>

      <AddItemRow onItemAdded={handleItemAdded} />

      {data.length === 0 ? (
        <p className="empty-state">The inventory is empty. Type a name above to add your first item.</p>
      ) : filteredData.length === 0 ? (
        <p className="empty-state">No items match the current filters.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              {COLUMNS.map(({ field, label }) => {
                const isActive = sort.field === field;
                return (
                  <th
                    key={field}
                    // Tells screen readers which column the table is sorted by, and which way.
                    aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className={`sort-btn${isActive ? ' sort-btn--active' : ''}`}
                      onClick={() => handleSortClick(field)}
                    >
                      {label}
                      <span className="sort-btn__arrow" aria-hidden="true">
                        {isActive ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                );
              })}
              {/* Reserves the 5th column for the three-dot actions button. */}
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <InventoryRow
                key={item.id}
                item={item}
                isOpen={expandedId === item.id}
                isHighlighted={highlightedId === item.id}
                onToggle={() => handleToggle(item.id)}
                onItemUpdate={updateItem}
                // Pass `deleteItem` down so InventoryRow can remove the item after a delete.
                onDelete={deleteItem}
                className={i % 2 === 0 ? '' : 'row-shaded'}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryPage;
