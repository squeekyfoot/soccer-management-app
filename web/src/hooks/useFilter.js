import { useState, useMemo } from 'react';

/**
 * @param {Array} data - The raw list of items (e.g., all rosters)
 * @param {Object} initialFilters - Default state (e.g., { season: 'All' })
 * @param {Function} filterFn - Logic to check if an item passes (item, filters) => boolean
 */
export const useFilter = (data, initialFilters, filterFn) => {
  const [filters, setFilters] = useState(initialFilters);

  // Update a single filter key
  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset all
  const resetFilters = () => setFilters(initialFilters);

  // The filtered result (Memoized for performance)
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => filterFn(item, filters));
  }, [data, filters, filterFn]);

  return {
    filters,
    setFilter,
    resetFilters,
    filteredData
  };
};