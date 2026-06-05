import { useRef, useState, useEffect } from 'react';
import { filterInventory } from '../../utils/filterInventory';
import { useInventory } from '../../utils/useInventory';
import SearchBar from '../SearchBar';
import InventoryRow from './InventoryRow';
import TagFilterDropdown from './TagFilterDropdown';
import '../../styles/InventoryPage.css';

function InventoryPage() {
  // `updateItem` reflects edits; `deleteItem` removes an item — both avoid a full re-fetch.
  const { data, loading, error, updateItem, deleteItem } = useInventory();
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedId, setExpandedId]     = useState(null);

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

  async function handleFilterButtonClick() {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }
    // Fetch tags from the server on first open only.
    if (!tagsLoaded) {
      try {
        const res = await fetch('/api/inventory/tags');
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

  const filteredData = filterInventory(data, searchQuery, activeTags);

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
      <h2>Inventory</h2>

      <div className="inventory-controls">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

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

      {data.length === 0 ? (
        <p className="empty-state">The inventory database is empty.</p>
      ) : filteredData.length === 0 ? (
        <p className="empty-state">No items match the current filters.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              {/* The empty string at the end reserves the 5th column for the three-dot actions button. */}
              {['Name', 'Type', 'Location', 'Status', ''].map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <InventoryRow
                key={item.id}
                item={item}
                isOpen={expandedId === item.id}
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
