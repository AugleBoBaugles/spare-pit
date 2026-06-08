// Dropdown panel that shows all available tags as toggleable chips.
// Rendered by InventoryPage; closed when the user clicks outside the wrapper.
function TagFilterDropdown({ tags, activeTags, onTagToggle, tagCounts = {} }) {
  if (tags.length === 0) {
    return (
      <div className="tag-filter-dropdown">
        <p className="tag-filter-dropdown__empty">No tags in database.</p>
      </div>
    );
  }

  return (
    <div className="tag-filter-dropdown">
      <ul className="tag-filter-dropdown__list">
        {tags.map(tag => {
          const active = activeTags.includes(tag);
          const count = tagCounts[tag] ?? 0;
          return (
            <li key={tag}>
              <button
                aria-pressed={active}
                className={`tag-chip${active ? ' tag-chip--active' : ''}`}
                onClick={() => onTagToggle(tag)}
              >
                {tag}
                <span className="tag-chip__count" aria-hidden="true">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TagFilterDropdown;
