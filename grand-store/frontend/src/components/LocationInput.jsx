import React, { useEffect, useRef } from 'react';

export default function LocationInput({
  name,
  value,
  onChange,
  placeholder,
  className,
  required,
  type = "text",
  onPlaceDetails,
  restrictToSouthAfrica = false
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const onChangeRef = useRef(onChange);
  const onPlaceDetailsRef = useRef(onPlaceDetails);

  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceDetailsRef.current = onPlaceDetails;
  }, [onChange, onPlaceDetails]);

  useEffect(() => {
    let checkInterval;
    
    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) {
        return false;
      }
      
      // Clean up previous listeners if any
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        ...(restrictToSouthAfrica ? { componentRestrictions: { country: 'za' } } : {})
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place && (place.formatted_address || place.name)) {
          
          let city = '';
          let postalCode = '';
          let country = restrictToSouthAfrica ? 'South Africa' : '';
          let lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : null;
          let lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : null;
          const addressToUse = place.formatted_address || place.name;

          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types || [];
              
              if (types.includes('locality') || types.includes('postal_town') || types.includes('sublocality') || types.includes('administrative_area_level_3')) {
                if (!city) city = component.long_name;
              }
              if (types.includes('postal_code')) {
                postalCode = component.long_name;
              }
              if (!restrictToSouthAfrica && types.includes('country')) {
                country = component.long_name;
              }
            }
          }

          const event = {
            target: {
              name: name,
              value: addressToUse
            }
          };
          
          if (onChangeRef.current) {
            onChangeRef.current(event);
          }

          if (onPlaceDetailsRef.current) {
            onPlaceDetailsRef.current({
              address: addressToUse,
              city,
              postalCode,
              country: restrictToSouthAfrica ? 'South Africa' : (country || 'South Africa'),
              lat,
              lng
            });
          }
        }
      });
      return true;
    };

    // Try immediately
    if (!initAutocomplete()) {
      // If not loaded, check every 500ms
      checkInterval = setInterval(() => {
        if (initAutocomplete()) {
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [name, restrictToSouthAfrica]);

  useEffect(() => {
    if (autocompleteRef.current && typeof autocompleteRef.current.setComponentRestrictions === 'function') {
      autocompleteRef.current.setComponentRestrictions(
        restrictToSouthAfrica ? { country: 'za' } : null
      );
    }
  }, [restrictToSouthAfrica]);

  return (
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
      required={required}
      className={className}
      placeholder={placeholder}
    />
  );
}
