import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing a value.
 * Useful for search inputs to avoid excessive API calls.
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
