import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Star } from 'lucide-react';
import rawCountries from '../utils/phoneCountries.json';

// Helper to generate Unicode flag emoji from 2-letter ISO country code (fallback)
export function getCountryFlag(iso) {
  if (!iso || iso.length !== 2) return '🌐';
  try {
    const codePoints = iso
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
}

// Crisp FlagCDN image with Unicode flag emoji fallback
export function CountryFlag({ iso, className = '' }) {
  const [failed, setFailed] = useState(false);
  const code = (iso || '').trim().toLowerCase();

  useEffect(() => {
    setFailed(false);
  }, [code]);

  if (code && code.length === 2 && !failed) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width="20"
        height="14"
        loading="lazy"
        decoding="async"
        alt={`${iso} flag`}
        className={`inline-block h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.18)] ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex h-3.5 w-5 shrink-0 items-center justify-center text-xs leading-none select-none ${className}`}
      aria-hidden="true"
    >
      {getCountryFlag(iso)}
    </span>
  );
}

// Popular / Recommended countries prioritized at the top
const POPULAR_ISO_CODES = [
  'ZA', // South Africa
  'US', // United States
  'GB', // United Kingdom
  'IN', // India
  'AU', // Australia
  'AE', // UAE
  'DE', // Germany
  'FR', // France
  'CA', // Canada
  'NA', // Namibia
  'BW', // Botswana
  'ZW', // Zimbabwe
  'NG', // Nigeria
  'KE', // Kenya
];

export default function CountryCodeSelect({
  value = '+27',
  onChange,
  className = '',
  buttonClassName = '',
  showName = false,
  disabled = false,
  id = 'country-code-select',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIso, setSelectedIso] = useState(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // All countries list
  const allCountries = useMemo(() => {
    return rawCountries.map((c) => ({
      ...c,
      flagCode: c.country,
    }));
  }, []);

  // Selected country lookup (accepts either ISO code like 'ZA' or dial code like '+27')
  const selectedCountry = useMemo(() => {
    const explicitIso = allCountries.find((c) => c.country.toUpperCase() === String(value).toUpperCase());
    const chosenCountry = allCountries.find((c) => c.country === selectedIso && c.dialCode === value);
    const preferredCountry = POPULAR_ISO_CODES
      .map((iso) => allCountries.find((c) => c.country === iso))
      .find((c) => c?.dialCode === value);
    const dialMatch = allCountries.find((c) => c.dialCode === value);
    return explicitIso || chosenCountry || preferredCountry || dialMatch || allCountries.find((c) => c.country === 'ZA') || allCountries[0];
  }, [allCountries, value, selectedIso]);

  // Filtered countries based on search query
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCountries;

    const cleanQ = q.startsWith('+') ? q.slice(1) : q;

    return allCountries.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const isoMatch = c.country.toLowerCase().includes(q);
      const dialMatch = c.dialCode.toLowerCase().includes(q) || c.dialCode.replace('+', '').includes(cleanQ);
      return nameMatch || isoMatch || dialMatch;
    });
  }, [allCountries, search]);

  // Recommended popular countries
  const popularCountries = useMemo(() => {
    return POPULAR_ISO_CODES.map((iso) => allCountries.find((c) => c.country === iso)).filter(Boolean);
  }, [allCountries]);

  // Close dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle key press (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (country) => {
    setSelectedIso(country.country);
    if (onChange) {
      onChange(country.dialCode, country);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Phone country code: ${selectedCountry.name} ${selectedCountry.dialCode}`}
        className={`flex items-center gap-2 px-3 py-2 bg-stone-900/90 hover:bg-stone-800/90 border-r border-white/10 text-xs text-[#c9a35b] font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'bg-stone-800 text-white' : ''
        } ${buttonClassName}`}
      >
        <CountryFlag iso={selectedCountry.country} />
        <span className="font-mono font-semibold text-white tracking-tight">{selectedCountry.dialCode}</span>
        {showName && (
          <span className="hidden sm:inline-block max-w-[75px] truncate text-[11px] text-white/50 font-medium">
            {selectedCountry.name}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`text-stone-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#c9a35b]' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-[min(calc(100vw-2.5rem),24rem)] sm:w-96 bg-[#0f0e0c] border border-[#c9a35b]/35 rounded-xl shadow-2xl backdrop-blur-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-stone-200"
          style={{ boxShadow: '0 20px 50px -5px rgba(0, 0, 0, 0.95), 0 0 25px rgba(201, 163, 91, 0.2)' }}
        >
          {/* Search Header */}
          <div className="p-2.5 border-b border-white/10 bg-black/70 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, dial code (+27)..."
                className="w-full bg-stone-900/95 border border-white/15 focus:border-[#c9a35b] rounded-lg pl-8 pr-7 py-2 text-xs text-white placeholder-stone-500 outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-stone-700">
            {/* When search is empty: show Popular & Recommended section */}
            {!search && (
              <div className="p-2 bg-white/[0.015]">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c9a35b] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Star size={11} className="text-[#c9a35b] fill-[#c9a35b]" />
                    Popular & Recommended
                  </span>
                  <span className="text-[9px] text-white/40 font-normal">Quick select</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {popularCountries.map((c) => {
                    const isSelected = selectedCountry.country === c.country;
                    return (
                      <button
                        key={`pop-${c.country}`}
                        type="button"
                        onClick={() => handleSelect(c)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#c9a35b]/25 text-white font-semibold border border-[#c9a35b]/60 shadow-[0_0_10px_rgba(201,163,91,0.2)]'
                            : 'hover:bg-white/5 text-stone-300 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <CountryFlag iso={c.country} />
                          <span className="truncate text-[11px] font-medium">{c.name}</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-[#c9a35b] ml-1.5 shrink-0">{c.dialCode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All / Filtered Countries */}
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                <span>{search ? `Search Matches (${filteredCountries.length})` : 'All Countries'}</span>
                {!search && <span className="text-[10px] font-normal text-stone-500">{allCountries.length} countries</span>}
              </div>

              {filteredCountries.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <p>No countries matching "{search}"</p>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-2 text-[11px] text-[#c9a35b] underline hover:text-[#d5b46c] cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {filteredCountries.map((c) => {
                    const isSelected = selectedCountry.country === c.country;
                    return (
                      <button
                        key={c.country}
                        type="button"
                        onClick={() => handleSelect(c)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#c9a35b]/20 text-white font-semibold border border-[#c9a35b]/50'
                            : 'hover:bg-white/5 text-stone-300 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <CountryFlag iso={c.country} />
                          <span className="truncate font-medium">{c.name}</span>
                          <span className="text-[10px] text-stone-500 uppercase font-mono">({c.country})</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-mono font-semibold text-[#c9a35b]">{c.dialCode}</span>
                          {isSelected && <Check size={13} className="text-[#c9a35b]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
