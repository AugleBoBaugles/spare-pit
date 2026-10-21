// The Area → Location picker shared by the add-item form and the item edit panel.
// Renders two sibling fields: an Area select ("None" = no location) and a Location text
// field suggesting that area's locations. Typing a name that isn't there yet creates a
// new location in that area when the item is saved (see resolveLocationId).
//
// `classPrefix` picks up the host form's styles: '<prefix>__field', '__label',
// '__hint' and '__field-error' (both forms use that same structure).
import { UNASSIGNED, findLocationInArea, locationsInArea } from '../utils/useLocations';

function LocationFields({
  idPrefix, classPrefix, areaKey, locationName, onChange, areas, locations, error,
}) {
  const options = locationsInArea(locations, areaKey);
  const areaName = areaKey === UNASSIGNED
    ? null
    : areas.find((a) => String(a.id) === areaKey)?.name;
  const isNew = areaKey && locationName.trim() !== '' && !findLocationInArea(locations, areaKey, locationName);

  // Each area has its own locations, so switching area clears the location.
  function handleAreaChange(e) {
    onChange('areaKey', e.target.value);
    onChange('locationName', '');
  }

  return (
    <>
      <div className={`${classPrefix}__field`}>
        <label className={`${classPrefix}__label`} htmlFor={`${idPrefix}-area`}>Area</label>
        <select id={`${idPrefix}-area`} value={areaKey} onChange={handleAreaChange}>
          <option value="">None</option>
          {areas.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
          <option value={UNASSIGNED}>Not in an area</option>
        </select>
      </div>

      <div className={`${classPrefix}__field`}>
        <label className={`${classPrefix}__label`} htmlFor={`${idPrefix}-location`}>Location</label>
        <input
          id={`${idPrefix}-location`}
          type="text"
          list={`${idPrefix}-location-options`}
          value={locationName}
          onChange={(e) => onChange('locationName', e.target.value)}
          placeholder={areaKey ? 'e.g. Tool Cabinet A' : 'Pick an area first'}
          disabled={!areaKey}
          aria-invalid={!!error}
          autoComplete="off"
        />
        <datalist id={`${idPrefix}-location-options`}>
          {options.map((l) => <option key={l.id} value={l.name} />)}
        </datalist>
        {isNew && !error && (
          <span className={`${classPrefix}__hint`}>
            New location — it will be added {areaName ? `to ${areaName}` : 'without an area'}.
          </span>
        )}
        {error && <span className={`${classPrefix}__field-error`}>{error}</span>}
      </div>
    </>
  );
}

export default LocationFields;
