import React, { useState } from 'react';
import './Composer.css';

const Composer = ({ items, onRemove }) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const handleDownload = (format) => {
    console.log(`Downloading as ${format}`);
    setShowDownloadOptions(false);
    alert(`Download initiated as ${format} format`);
  };

  const toggleDownloadOptions = () => {
    setShowDownloadOptions(!showDownloadOptions);
  };

  return (
    <div className="composer-wrapper">
      <div className="composer-title">
        <div className="green-line"></div>
        <h2>Composer</h2>
      </div>
      
      <div className="composer-container">
        <div className="composer-content">
            {/* Empty content */}
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <div className="hamburger-lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
                  <div className="plus-icon">+</div>
                </div>
                <p className="empty-text">
                  Your List is Empty. Select Codes From Search Results.
                </p>
              </div>
            ) : (
              /* actually has content */
              <ul className="composer-list">
                {items.map(item => {
                  const displayCode = [item.icd_code, item.nam_code].filter(Boolean).join(' / ');

                  return (
                    <li key={item.id} className="composer-item">
                      <div className="item-details">
                        <span className="item-title">{item.display || item.title}</span>
                        <span className="item-code">
                          {displayCode || 'N/A'}
                        </span>
                      </div>
                      <button onClick={() => onRemove(item)} className="remove-btn">
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="composer-footer">
          <button 
            className="download-btn"
            onClick={toggleDownloadOptions}
          >
            <svg className="download-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
              <path d="M14 2V8H20"/>
            </svg>
            Generate FHIR Bundle
          </button>
          
          {showDownloadOptions && (
            <div className="download-dropdown">
              <button 
                className="dropdown-item"
                onClick={() => handleDownload('JSON')}
              >
                JSON Format
              </button>
              <button 
                className="dropdown-item"
                onClick={() => handleDownload('PDF')}
              >
                PDF Format
              </button>
              <button 
                className="dropdown-item"
                onClick={() => handleDownload('Excel')}
              >
                Excel Format
              </button>
            </div>
          )}
        </div>
      </div>
  );
};

export default Composer;