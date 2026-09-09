import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export function LocaleIcon({ option, className = '' }) {
  const [failed, setFailed] = useState(false);
  const code = (option?.flagCode || option?.code || option?.value || '').trim().toLowerCase();

  useEffect(() => {
    setFailed(false);
  }, [code]);

  if (code && !failed) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width="20"
        height="14"
        loading="lazy"
        decoding="async"
        alt=""
        className={`inline-block h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.18)] ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  if (option?.icon) {
    return <span className={`text-xs ${className}`}>{option.icon}</span>;
  }

  return (
    <span className={`locale-flag-fallback ${className}`} aria-hidden="true">
      {option?.flagCode || option?.value?.slice(0, 2) || '🌐'}
    </span>
  );
}

export default function LocaleSelector({
  ariaLabel,
  value,
  options,
  onChange,
  searchPlaceholder,
  disabled = false,
  compact = false,
  embedded = false
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const activeOptionRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value) || options[0];

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;

    const startsWith = [];
    const includes = [];
    options.forEach((option) => {
      const searchableText = `${option.label} ${option.value} ${option.keywords || ''}`.toLocaleLowerCase();
      if (!searchableText.includes(normalizedQuery)) return;
      if (option.label.toLocaleLowerCase().startsWith(normalizedQuery) || option.value.toLocaleLowerCase().startsWith(normalizedQuery)) {
        startsWith.push(option);
      } else {
        includes.push(option);
      }
    });
    return [...startsWith, ...includes];
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;

    const selectedIndex = Math.max(0, filteredOptions.findIndex((option) => option.value === value));
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className={`locale-picker ${compact ? 'locale-picker-compact' : ''} ${embedded ? 'locale-picker-embedded' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="locale-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {selectedOption && <LocaleIcon option={selectedOption} className="locale-trigger-icon" />}
        <span className="locale-trigger-label">{compact ? selectedOption?.value : selectedOption?.label}</span>
        <ChevronDown size={12} className={open ? 'rotate-180' : ''} aria-hidden="true" />
      </button>

      {open && (
        <div className="locale-menu" aria-label={`${ariaLabel} options`}>
          <div className="locale-menu-heading">
            <strong>{ariaLabel}</strong>
            <span>Search and select</span>
          </div>
          <div className="locale-search-field">
            <Search size={15} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={`Search ${ariaLabel.toLowerCase()}`}
              aria-controls={`${ariaLabel.replace(/\s+/g, '-').toLowerCase()}-options`}
              autoComplete="off"
            />
          </div>
          <div className="locale-options" id={`${ariaLabel.replace(/\s+/g, '-').toLowerCase()}-options`} role="listbox">
            {filteredOptions.length ? filteredOptions.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;
              return (
                <button
                  key={option.value}
                  ref={active ? activeOptionRef : null}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`locale-option ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="locale-option-icon" aria-hidden="true"><LocaleIcon option={option} /></span>
                  <span className="locale-option-copy">
                    <strong>{option.label}</strong>
                    {option.value !== option.label && <small>{option.value}</small>}
                  </span>
                  {selected && <Check size={15} aria-hidden="true" />}
                </button>
              );
            }) : (
              <p className="locale-empty">No matching options</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
