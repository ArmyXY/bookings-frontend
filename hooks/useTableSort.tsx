import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableSort<T extends Record<string, any>>(
  data: T[],
  initialKey: keyof T | null = null,
  initialDirection: SortDirection = 'desc'
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (sortKey === key && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortKey(key);
    setSortDirection(direction);
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      // Handle nulls/undefined
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle strings (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numbers and other comparables
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;

      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const renderSortIcon = (key: keyof T) => {
    const isActive = sortKey === key;
    const isAsc = isActive && sortDirection === 'asc';

    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        style={{
          marginLeft: '5px',
          display: 'inline-block',
          verticalAlign: 'middle',
          opacity: isActive ? 1 : 0.3,
          transform: isAsc ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'all 0.2s ease',
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  };

  return { sortKey, sortDirection, requestSort, sortedData, renderSortIcon };
}
