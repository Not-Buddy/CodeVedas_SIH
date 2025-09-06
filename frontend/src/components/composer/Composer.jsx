// src/components/composer/Composer.jsx

import React from 'react';
import './Composer.css';

const Composer = () => {
  return (
    <div className="composer-container">
      <h2 className="composer-title">Composer</h2>
      
      <div className="composer-empty-state">
        {/* SVG icon for the empty list */}
        <svg className="composer-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M12 15H36V17H12V15Z" fill="#E0E0E0"/>
          <path d="M12 23H36V25H12V23Z" fill="#E0E0E0"/>
          <path d="M12 31H36V33H12V31Z" fill="#E0E0E0"/>
        </svg>
        <p className="composer-empty-text">
          Your List is Empty Select Codes From Search Results.
        </p>
      </div>

      <button className="composer-button">
        {/* NEW: Icon inside the button */}
        <svg className="button-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Generate FHIR Bundle</span>
      </button>
    </div>
  );
};

export default Composer;