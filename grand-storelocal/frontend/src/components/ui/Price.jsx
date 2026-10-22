import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * Parses a formatted price string into sign, currency symbol, and number parts.
 * Ensures the symbol and digits can be rendered as non-breaking, properly aligned units.
 */
const parsePriceDisplay = (strVal) => {
  if (typeof strVal !== 'string') {
    return { isNegative: false, symbol: '', num: String(strVal ?? ''), position: 'none' };
  }
  const trimmed = strVal.trim();
  const isNegative = trimmed.startsWith('-');
  const clean = isNegative ? trimmed.slice(1).trim() : trimmed;

  // Prefix symbol pattern: e.g. "₹ 443,156.25", "R 95,000.00", "$1,250.00"
  const prefixMatch = clean.match(/^([^\d\-+]+)\s*([\d,.]+)$/);
  if (prefixMatch) {
    let numStr = prefixMatch[2].trim();
    if (numStr.includes('.')) {
      const parts = numStr.split('.');
      const intVal = parseInt(parts[0].replace(/,/g, ''), 10) || 0;
      const decVal = parseFloat(`0.${parts[1]}`) || 0;
      numStr = (decVal >= 0.5 ? intVal + 1 : intVal).toLocaleString('en-US');
    }
    return {
      isNegative,
      symbol: prefixMatch[1].trim(),
      num: numStr,
      position: 'prefix'
    };
  }

  // Suffix symbol pattern: e.g. "100.00 EUR"
  const suffixMatch = clean.match(/^([\d,.]+)\s*([^\d\-+]+)$/);
  if (suffixMatch) {
    let numStr = suffixMatch[1].trim();
    if (numStr.includes('.')) {
      const parts = numStr.split('.');
      const intVal = parseInt(parts[0].replace(/,/g, ''), 10) || 0;
      const decVal = parseFloat(`0.${parts[1]}`) || 0;
      numStr = (decVal >= 0.5 ? intVal + 1 : intVal).toLocaleString('en-US');
    }
    return {
      isNegative,
      symbol: suffixMatch[2].trim(),
      num: numStr,
      position: 'suffix'
    };
  }

  let finalClean = clean;
  if (finalClean.includes('.')) {
    const parts = finalClean.split('.');
    const intVal = parseInt(parts[0].replace(/,/g, ''), 10) || 0;
    const decVal = parseFloat(`0.${parts[1]}`) || 0;
    finalClean = (decVal >= 0.5 ? intVal + 1 : intVal).toLocaleString('en-US');
  }

  return { isNegative, symbol: '', num: finalClean, position: 'none' };
};

const Price = ({ amount, className = "", forceZAR = false, presentation = "default" }) => {
  const { formatPrice, loading } = useCurrency();
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  let displayValue;

  if (loading || forceZAR || isAdmin) {
    const cleanStr = String(amount ?? 0).replace(/[^0-9.-]/g, '');
    const formatted = parseFloat(cleanStr);
    displayValue = isNaN(formatted)
      ? amount 
      : `R\u00A0${Math.round(formatted).toLocaleString('en-US')}`;
  } else {
    displayValue = formatPrice(amount);
  }

  const { isNegative, symbol, num, position } = parsePriceDisplay(displayValue);

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap font-sans font-bold tabular-nums leading-none ${className}`}
      style={{
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        verticalAlign: 'baseline',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
      aria-label={String(displayValue)}
    >
      {isNegative && <span className="shrink-0 mr-[0.1em]">-</span>}
      {position === 'prefix' && symbol && (
        <span className="shrink-0 mr-[0.18em] select-none opacity-95">
          {symbol}
        </span>
      )}
      <span className="shrink-0">{num}</span>
      {position === 'suffix' && symbol && (
        <span className="shrink-0 ml-[0.18em] select-none opacity-95">
          {symbol}
        </span>
      )}
    </span>
  );
};

export default Price;
