import React, { useEffect, useRef } from 'react';

export default function CityInput({
  name = 'city',
  value,
  onChange,
  onCityDetails,
  placeholder,
  className,
  required,
  restrictToSouthAfrica = false
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onCityDetailsRef = useRef(onCityDetails);

  useEffect(() => {
    onChangeRef.current = onChange;
    onCityDetailsRef.current = onCityDetails;
  }, [onChange, onCityDetails]);

  useEffect(() => {
    let checkInterval;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) return false;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        ...(restrictToSouthAfrica ? { componentRestrictions: { country: 'za' } } : {})
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place) return;

        let city = '';
        let country = '';
        let postalCode = '';

        for (const component of place.address_components || []) {
          const types = component.types || [];
          if (!city && (
            types.includes('locality') ||
            types.includes('postal_town') ||
            types.includes('administrative_area_level_3') ||
            types.includes('sublocality')
          )) {
            city = component.long_name;
          }
          if (types.includes('country')) country = component.long_name;
          if (types.includes('postal_code')) postalCode = component.long_name;
        }

        city = city || place.name || place.formatted_address?.split(',')[0] || '';
        if (!city) return;

        onChangeRef.current?.({ target: { name, value: city } });
        onCityDetailsRef.current?.({
          city,
          country: restrictToSouthAfrica ? 'South Africa' : country,
          postalCode,
          lat: typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : null,
          lng: typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : null
        });
      });

      return true;
    };

    if (!initAutocomplete()) {
      checkInterval = window.setInterval(() => {
        if (initAutocomplete()) window.clearInterval(checkInterval);
      }, 500);
    }

    return () => {
      if (checkInterval) window.clearInterval(checkInterval);
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [name, restrictToSouthAfrica]);

  return (
    <input
      ref={inputRef}
      type="search"
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
      }}
      autoComplete="off"
      required={required}
      className={className}
      placeholder={placeholder}
      role="combobox"
      aria-autocomplete="list"
      aria-label={restrictToSouthAfrica ? 'Search South African city' : 'Search city'}
    />
  );
}
