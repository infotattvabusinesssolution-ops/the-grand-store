import React, { useCallback, useEffect, useRef, useState } from 'react';

const normalisePostalCode = (value) => String(value || '').trim();

const getPostalCodeFromComponents = (components = []) => (
  components.find((component) => component.types?.includes('postal_code'))?.long_name || ''
);

export default function PostalCodeInput({
  name = 'postalCode',
  value,
  onChange,
  onPostalDetails,
  placeholder,
  className,
  required,
  restrictToSouthAfrica = false,
  city = '',
  cityLat = null,
  cityLng = null,
  suggestedPostalCodes = []
}) {
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);
  const autocompleteService = useRef(null);
  const geocoderService = useRef(null);
  const wrapperRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let interval;
    const initServices = () => {
      if (!window.google?.maps?.places) return false;
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (window.google.maps.Geocoder) geocoderService.current = new window.google.maps.Geocoder();
      setServiceReady(true);
      return true;
    };

    if (!initServices()) {
      interval = window.setInterval(() => {
        if (initServices()) window.clearInterval(interval);
      }, 500);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const makeSuggestedPredictions = useCallback(() => (
    [...new Set(suggestedPostalCodes.map(normalisePostalCode).filter(Boolean))].map((postalCode) => ({
      place_id: `suggested-${city}-${postalCode}`,
      postalCode,
      description: `${postalCode}, ${city}`
    }))
  ), [city, suggestedPostalCodes]);

  const requestAutocompletePredictions = useCallback((input) => new Promise((resolve) => {
    if (!autocompleteService.current || !input) return resolve([]);

    const numericLat = Number(cityLat);
    const numericLng = Number(cityLng);
    const hasCoordinates = cityLat !== null && cityLat !== undefined && cityLat !== ''
      && cityLng !== null && cityLng !== undefined && cityLng !== ''
      && Number.isFinite(numericLat) && Number.isFinite(numericLng);
    const request = {
      input,
      types: ['postal_code'],
      ...(restrictToSouthAfrica ? { componentRestrictions: { country: 'za' } } : {})
    };

    if (hasCoordinates && window.google?.maps?.LatLng) {
      request.location = new window.google.maps.LatLng(numericLat, numericLng);
      request.radius = 60000;
    }

    autocompleteService.current.getPlacePredictions(request, (results, status) => {
      const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK || 'OK';
      resolve(status === okStatus && Array.isArray(results) ? results : []);
    });
  }), [cityLat, cityLng, restrictToSouthAfrica]);

  const requestGeocodedPostalCodes = useCallback(() => new Promise((resolve) => {
    if (!geocoderService.current || !city) return resolve([]);

    const numericLat = Number(cityLat);
    const numericLng = Number(cityLng);
    const hasCoordinates = cityLat !== null && cityLat !== undefined && cityLat !== ''
      && cityLng !== null && cityLng !== undefined && cityLng !== ''
      && Number.isFinite(numericLat) && Number.isFinite(numericLng);
    const request = hasCoordinates
      ? { location: { lat: numericLat, lng: numericLng } }
      : {
          address: `${city}${restrictToSouthAfrica ? ', South Africa' : ''}`,
          ...(restrictToSouthAfrica ? { componentRestrictions: { country: 'ZA' } } : {})
        };

    geocoderService.current.geocode(request, (results, status) => {
      if (status !== 'OK' || !Array.isArray(results)) return resolve([]);
      resolve(results.map((result, index) => {
        const postalCode = getPostalCodeFromComponents(result.address_components);
        return postalCode ? {
          place_id: result.place_id || `geocoded-${city}-${postalCode}-${index}`,
          postalCode,
          description: result.formatted_address || `${postalCode}, ${city}`
        } : null;
      }).filter(Boolean));
    });
  }), [city, cityLat, cityLng, restrictToSouthAfrica]);

  const mergePredictions = useCallback((groups) => {
    const seen = new Set();
    return groups.flat().reduce((merged, prediction) => {
      const postalCode = normalisePostalCode(
        prediction.postalCode
        || prediction.terms?.[0]?.value
        || prediction.description?.match(/\b\d{4}\b/)?.[0]
      );
      if (!postalCode || seen.has(postalCode)) return merged;
      seen.add(postalCode);
      merged.push({ ...prediction, postalCode });
      return merged;
    }, []);
  }, []);

  const fetchPredictions = useCallback(async (typedValue = '') => {
    if (!city) {
      setPredictions([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    const trimmedValue = normalisePostalCode(typedValue);
    const cityQuery = trimmedValue
      ? `${trimmedValue}, ${city}${restrictToSouthAfrica ? ', South Africa' : ''}`
      : `postal code ${city}${restrictToSouthAfrica ? ', South Africa' : ''}`;

    try {
      const [autocompleteResults, geocoderResults] = await Promise.all([
        requestAutocompletePredictions(cityQuery),
        trimmedValue ? Promise.resolve([]) : requestGeocodedPostalCodes()
      ]);
      if (requestId !== requestIdRef.current) return;

      const suggestedResults = makeSuggestedPredictions().filter((prediction) => (
        !trimmedValue || prediction.postalCode.includes(trimmedValue)
      ));
      setPredictions(mergePredictions([suggestedResults, autocompleteResults, geocoderResults]));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [city, makeSuggestedPredictions, mergePredictions, requestAutocompletePredictions, requestGeocodedPostalCodes, restrictToSouthAfrica]);

  useEffect(() => {
    setPredictions([]);
    if (city && serviceReady && !value) {
      setIsOpen(true);
      fetchPredictions();
    }
  }, [city, cityLat, cityLng, fetchPredictions, serviceReady, value]);

  const handleFocus = () => {
    setIsOpen(true);
    fetchPredictions(value);
  };

  const handleInputChange = (event) => {
    onChange?.(event);
    setIsOpen(true);
    fetchPredictions(event.target.value);
  };

  const handleSelect = (prediction) => {
    const postalCode = normalisePostalCode(
      prediction.postalCode
      || prediction.terms?.[0]?.value
      || prediction.description?.match(/\b\d{4}\b/)?.[0]
    );
    if (!postalCode) return;

    onChange?.({ target: { name, value: postalCode } });
    onPostalDetails?.({ postalCode, description: prediction.description });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="search"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        autoComplete="off"
        required={required}
        disabled={!city}
        className={`${className || ''} disabled:cursor-not-allowed disabled:opacity-50`}
        placeholder={city ? placeholder : 'Select a city first'}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={`${name}-suggestions`}
      />

      {isOpen && city && (
        <div id={`${name}-suggestions`} className="absolute z-[9999] w-full mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-[var(--color-ivory-muted)]">Finding postal codes for {city}...</div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction) => (
              <button
                type="button"
                key={prediction.place_id || `${prediction.postalCode}-${prediction.description}`}
                onClick={() => handleSelect(prediction)}
                className="block w-full px-4 py-3 hover:bg-white/5 cursor-pointer text-left text-sm text-white transition-colors border-b border-white/5 last:border-0"
              >
                <span className="font-medium text-[var(--color-gold)] mr-2">{prediction.postalCode}</span>
                <span className="text-[var(--color-ivory-muted)] text-xs">{prediction.description}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-[var(--color-ivory-muted)]">
              No postal-code suggestion was returned for {city}. You can still enter the code manually.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
