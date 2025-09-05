import React, { useState } from 'react';
import './searchbar.css';

const SearchBar = ({ onSearch, onClear }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    systems: [],
    organSystem: 'All',
    discipline: [],
    language: []
  });

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setActiveFilters({
      systems: [],
      organSystem: 'All',
      discipline: [],
      language: []
    });
    if (onClear) {
      onClear();
    }
  };

  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      if (category === 'organSystem') {
        return { ...prev, [category]: value };
      }
      
      const currentValues = prev[category];
      if (currentValues.includes(value)) {
        return { 
          ...prev, 
          [category]: currentValues.filter(item => item !== value) 
        };
      } else {
        return { 
          ...prev, 
          [category]: [...currentValues, value] 
        };
      }
    });
  };

  const getFilterCount = () => {
    let count = 0;
    if (activeFilters.organSystem !== 'All') count++;
    count += activeFilters.systems.length;
    count += activeFilters.discipline.length;
    count += activeFilters.language.length;
    return count;
  };

  return (
    <div className="global-search-container">
      <h2 className="search-title">Global Search</h2>
      
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by code, title, or synonym..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="search-controls">
        <div className="filters-section">
          <button 
            className={`filters-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {getFilterCount() > 0 && (
              <span className="filter-count">{getFilterCount()}</span>
            )}
          </button>
          
          <div className="results-count">Results: 4</div>
        </div>
        
        <button className="clear-all-btn" onClick={handleClearAll}>
          Clear all
        </button>
      </div>

      {showFilters && (
        <div className="filters-dropdown">
          <div className="filters-content">
            <div className="filter-category">
              <h4>Systems</h4>
              {['NAMASTE', 'ICD-11 TM2', 'ICD-11 Biomedicine'].map(system => (
                <div key={system} className="filter-option">
                  <input
                    type="checkbox"
                    id={`system-${system}`}
                    checked={activeFilters.systems.includes(system)}
                    onChange={() => toggleFilter('systems', system)}
                  />
                  <label htmlFor={`system-${system}`} className="filter-label">
                    {system}
                  </label>
                </div>
              ))}
            </div>

            <div className="filter-category">
              <h4>Organ System</h4>
              <select 
                value={activeFilters.organSystem}
                onChange={(e) => toggleFilter('organSystem', e.target.value)}
                className="organ-system-select"
              >
                <option value="All">All</option>
                {/* Add other organ system options here */}
              </select>
            </div>

            <div className="filter-category">
              <h4>Discipline</h4>
              {['Ayurveda', 'Siddha', 'Unani'].map(discipline => (
                <div key={discipline} className="filter-option">
                  <input
                    type="checkbox"
                    id={`discipline-${discipline}`}
                    checked={activeFilters.discipline.includes(discipline)}
                    onChange={() => toggleFilter('discipline', discipline)}
                  />
                  <label htmlFor={`discipline-${discipline}`} className="filter-label">
                    {discipline}
                  </label>
                </div>
              ))}
            </div>

            <div className="filter-category">
              <h4>Language</h4>
              {['English', 'Hindi'].map(language => (
                <div key={language} className="filter-option">
                  <input
                    type="checkbox"
                    id={`language-${language}`}
                    checked={activeFilters.language.includes(language)}
                    onChange={() => toggleFilter('language', language)}
                  />
                  <label htmlFor={`language-${language}`} className="filter-label">
                    {language}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;