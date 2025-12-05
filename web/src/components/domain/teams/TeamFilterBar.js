import React from 'react';
import FilterBar from '../../ui/FilterBar';

const TeamFilterBar = ({ filters, onFilterChange, onReset }) => {
  
  // Define the "Shape" of a Team Filter
  const filterConfig = [
    {
      name: 'season',
      type: 'select',
      label: 'Season',
      options: [
        { label: 'Fall 2025', value: 'Fall 2025' },
        { label: 'Spring 2025', value: 'Spring 2025' },
      ]
    },
    {
      name: 'gameDay',
      type: 'select',
      label: 'Game Day',
      options: [
        { label: 'Sunday', value: 'Sun' },
        { label: 'Monday', value: 'Mon' },
        // ...
      ]
    },
    {
      name: 'recruitingOnly',
      type: 'toggle',
      label: 'Recruiting Only'
    }
  ];

  return (
    <FilterBar 
      config={filterConfig}
      activeFilters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    />
  );
};

export default TeamFilterBar;