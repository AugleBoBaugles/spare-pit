// Dropdown panel that shows all available tags as toggleable chips.
// Rendered by InventoryPage; closed when the user clicks outside the wrapper.
function TagFilterDropdown({ tags, activeTags, onTagToggle }) {
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
          return (
            <li key={tag}>
              <button
                // aria-pressed signals to screen readers that this is a toggle button.
                aria-pressed={active}
                className={`tag-chip${active ? ' tag-chip--active' : ''}`}
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TagFilterDropdown;
