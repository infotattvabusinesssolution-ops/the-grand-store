import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Globe } from 'lucide-react';
import rawCountries from '../utils/phoneCountries.json';
import { CountryFlag } from './CountryCodeSelect';

// Recommended popular cross-border destinations
const POPULAR_DESTINATION_CODES = [
  'ZA', // South Africa
  'GB', // United Kingdom
  'US', // United States
  'AE', // United Arab Emirates
  'DE', // Germany
  'FR', // France
  'AU', // Australia
  'CA', // Canada
  'CH', // Switzerland
  'IT', // Italy
  'NL', // Netherlands
  'SG', // Singapore
  'IN', // India
  'NZ', // New Zealand
  'IE', // Ireland
  'JP', // Japan
  'ES', // Spain
];

export default function DestinationCountrySelect({
  value = '',
  onChange,
  error = '',
  placeholder = 'Select destination country...',
  disabled = false,
  id = 'destination-country-select',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // All supported destination countries list (includes South Africa for international imports)
  const allCountries = useMemo(() => {
    return rawCountries
      .map((c) => ({
        ...c,
        flagCode: c.country,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Match currently selected country object
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const cleanVal = String(value).trim().toLowerCase();
    return (
      allCountries.find((c) => c.name.toLowerCase() === cleanVal) ||
      allCountries.find((c) => c.country.toLowerCase() === cleanVal) ||
      null
    );
  }, [allCountries, value]);

  // Filtered countries based on search query
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [allCountries, search]);

  // Popular destination countries
  const popularCountries = useMemo(() => {
    return POPULAR_DESTINATION_CODES.map((code) =>
      allCountries.find((c) => c.country === code)
    ).filter(Boolean);
  }, [allCountries]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
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
    if (onChange) {
      onChange(country.name, country);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full rounded-xl px-4 py-2.5 text-sm transition-all text-left flex items-center justify-between cursor-pointer focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border border-red-500 bg-red-950/20 ring-1 ring-red-500/50 text-white focus:border-red-500'
            : isOpen
            ? 'border border-[var(--color-gold)] bg-black/80 ring-1 ring-[var(--color-gold)]/40 text-white'
            : 'border border-white/10 bg-black/60 hover:border-white/25 hover:bg-black/80 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedCountry ? (
            <>
              <CountryFlag iso={selectedCountry.country} />
              <span className="font-medium text-white truncate">{selectedCountry.name}</span>
              <span className="text-[11px] text-white/40 font-mono uppercase hidden sm:inline">
                ({selectedCountry.country})
              </span>
            </>
          ) : value ? (
            <>
              <Globe size={16} className="text-white/40 shrink-0" />
              <span className="font-medium text-white truncate">{value}</span>
            </>
          ) : (
            <span className="text-white/30 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-white/40 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--color-gold)]' : ''
          }`}
        />
      </button>

      {/* Validation Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-medium animate-fadeIn">
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-[var(--color-gold)]/40 bg-[#0d0d0d] shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2.5 animate-fadeIn">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destination country..."
              className="w-full bg-black/80 border border-white/15 focus:border-[var(--color-gold)] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Popular Fast-Select Chips (shown when not searching) */}
          {!search && (
            <div className="mb-2 pb-2 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-gold)] font-bold mb-1.5 px-1 flex items-center justify-between">
                <span>Top Destinations</span>
                <span className="text-[9.5px] font-normal text-white/40 lowercase">quick select</span>
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {popularCountries.map((c) => {
                  const isPopSelected = selectedCountry?.country === c.country;
                  return (
                    <button
                      key={`pop-${c.country}`}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        isPopSelected
                          ? 'bg-[var(--color-gold)] text-black font-semibold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5'
                      }`}
                    >
                      <CountryFlag iso={c.country} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtered / Full Countries List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
            <div className="px-1 py-1 text-[10px] uppercase font-mono text-white/40 tracking-wider">
              {search ? `Matches (${filteredCountries.length})` : `All Countries (${filteredCountries.length})`}
            </div>

            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-white/40">
                No countries found matching "{search}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry?.country === c.country;
                return (
                  <button
                    key={c.country}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-semibold border border-[var(--color-gold)]/30'
                        : 'hover:bg-white/5 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag iso={c.country} />
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-white/30 font-mono">({c.country})</span>
                    </div>
                    {isSelected && <Check size={14} className="text-[var(--color-gold)] shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

