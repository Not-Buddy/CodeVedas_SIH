import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./Composer.css";

const Composer = ({ items, onRemove }) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showPatientPopup, setShowPatientPopup] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [hasPatientInfo, setHasPatientInfo] = useState(false);

  // Handle patient info changes
  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save patient information and close popup
  const savePatientInfo = () => {
    const hasInfo = patientInfo.name || patientInfo.email || patientInfo.phone;
    setHasPatientInfo(hasInfo);
    setShowPatientPopup(false);
  };

  // Clear patient information
  const clearPatientInfo = () => {
    setPatientInfo({
      name: '',
      email: '',
      phone: ''
    });
    setHasPatientInfo(false);
  };

  // Helper function to generate FHIR Bundle
  const generateFHIRBundle = () => {
    return {
      resourceType: "Bundle",
      id: `bundle-${Date.now()}`,
      type: "collection",
      timestamp: new Date().toISOString(),
      total: items.length,
      patient: patientInfo.name || patientInfo.email || patientInfo.phone ? {
        name: patientInfo.name,
        email: patientInfo.email,
        phone: patientInfo.phone
      } : null,
      entry: items.map((item, index) => ({
        fullUrl: `urn:uuid:${item.id || index}`,
        resource: {
          resourceType: "CodeableConcept",
          id: item.id || `code-${index}`,
          coding: [
            ...(item.icd_code ? [{
              system: "http://hl7.org/fhir/sid/icd-10",
              code: item.icd_code,
              display: item.display || item.title
            }] : []),
            ...(item.nam_code ? [{
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: item.nam_code,
              display: item.display || item.title
            }] : [])
          ],
          text: {
            status: "generated",
            div: `<div>${item.display || item.title}</div>`
          }
        }
      }))
    };
  };

  const handleDownload = (format) => {
    console.log(`Downloading as ${format}`);
    setShowDownloadOptions(false);
    
    try {
      const fhirBundle = generateFHIRBundle();
      
      switch (format) {
        case 'JSON':
          // Download as JSON
          const dataStr = JSON.stringify(fhirBundle, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `fhir-bundle-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;

        case 'PDF':
          // Create HTML content for PDF
          const htmlContent = `
 <!DOCTYPE html>
    <html>
    <head>
      <title>FHIR Bundle Report</title>
      <style>
        body {   font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #2d3748;
  background: #fff;}
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        h1 { color: #57D24B; border-bottom: 2px solid #57D24B; padding-bottom: 10px; margin-top: 0; flex-grow: 1; }
        .logo-img { 
          width: 300px; 
          height: auto; 
          margin-right: 20px;
        }
        .patient-info { background-color: #e6fffa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .item { margin: 15px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px;   margin: 15px 0;
  padding: 15px; }
        .code { font-weight: bold; color: #2d3748; }
        .display { color: #4a5568; margin-top: 5px; }
        .metadata { background-color: #f7fafc; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
          <h1 id="reportTitle"
      onload="this.innerText=document.querySelector('.patient-info p:nth-child(2)').innerText.replace('Name:','').trim() + ' FHIR Bundle Report'">
    FHIR Bundle Report
  </h1>
        <img src="data:image/png;base64, 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" alt="Company Logo" class="logo-img" />
      </div>
      ${patientInfo.name || patientInfo.email || patientInfo.phone ? `
      <div class="patient-info">
        <h3>Patient Information</h3>
        ${patientInfo.name ? `<p><strong>Name:</strong> ${patientInfo.name}</p>` : ''}
        ${patientInfo.email ? `<p><strong>Email:</strong> ${patientInfo.email}</p>` : ''}
        ${patientInfo.phone ? `<p><strong>Phone:</strong> ${patientInfo.phone}</p>` : ''}
      </div>
      ` : ''}
      <div class="metadata">
        <p><strong>Bundle ID:</strong> ${fhirBundle.id}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Items:</strong> ${fhirBundle.total}</p>
      </div>
      ${items.map(item => {
        const displayCode = [item.icd_code, item.nam_code].filter(Boolean).join(' / ');
        return `
          <div class="item">
            <div class="code">${displayCode || 'N/A'}</div>
            <div class="display">${item.display || item.title}</div>
          </div>
        `;
      }).join('')}
    </body>
      
    </html>
          `;

          const blob = new Blob([htmlContent], { type: 'text/html' });
          const pdfUrl = URL.createObjectURL(blob);
          const pdfLink = document.createElement('a');
          pdfLink.href = pdfUrl;
          pdfLink.download = `fhir-bundle-${new Date().toISOString().split('T')[0]}.html`;
          document.body.appendChild(pdfLink);
          pdfLink.click();
          document.body.removeChild(pdfLink);
          URL.revokeObjectURL(pdfUrl);
          
          alert('Downloaded as HTML file (open in browser and print to PDF for PDF format)');
          break;

        case 'Excel':
          // Download as Excel
          const worksheetData = [
            // Patient info rows (if available)
            ...(patientInfo.name || patientInfo.email || patientInfo.phone ? [
              ['PATIENT INFORMATION'],
              ['Name', patientInfo.name || ''],
              ['Email', patientInfo.email || ''],
              ['Phone', patientInfo.phone || ''],
              [''], // Empty row for spacing
              ['MEDICAL CODES'],
            ] : [['MEDICAL CODES']]),
            ['Title/Display', 'ICD Code', 'NAM Code', 'Combined Code', 'ID'],
            ...items.map(item => [
              item.display || item.title || '',
              item.icd_code || '',
              item.nam_code || '',
              [item.icd_code, item.nam_code].filter(Boolean).join(' / ') || 'N/A',
              item.id || ''
            ])
          ];

          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          
          // Set column widths
          worksheet['!cols'] = [
            { width: 30 }, // Title/Display
            { width: 15 }, // ICD Code
            { width: 15 }, // NAM Code
            { width: 20 }, // Combined Code
            { width: 10 }  // ID
          ];

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'FHIR Bundle');

          // Add metadata sheet
          const metadataSheet = XLSX.utils.aoa_to_sheet([
            ['FHIR Bundle Metadata'],
            ['Generated', new Date().toISOString()],
            ['Total Items', items.length],
            ['Bundle Type', 'collection']
          ]);
          XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

          XLSX.writeFile(workbook, `fhir-bundle-${new Date().toISOString().split('T')[0]}.xlsx`);
          break;

        default:
          alert('Unsupported format');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const toggleDownloadOptions = () => {
    setShowDownloadOptions(!showDownloadOptions);
  };

  const togglePatientPopup = () => {
    setShowPatientPopup(!showPatientPopup);
  };

  return (
    <div className="composer-wrapper">
      <div className="composer-title">
        <div className="green-line"></div>
        <h2>Composer</h2>
      </div>
      
      {/* Patient Information Button and Display */}
      <div className="patient-info-section">
        <button 
          className="patient-info-btn"
          onClick={togglePatientPopup}
        >
          <svg className="patient-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"/>
            <path d="M18 18C18 15.7909 16.2091 14 14 14H10C7.79086 14 6 15.7909 6 18V20H18V18Z"/>
          </svg>
          {hasPatientInfo ? 'Edit Patient Information' : 'Patient Information'}
        </button>

        {/* Display saved patient information */}
        {hasPatientInfo && (
          <div className="patient-info-display">
            <button className="clear-patient-info" onClick={clearPatientInfo}>
              &times;
            </button>
            <h4>Patient Information</h4>
            {patientInfo.name && <p><strong>Name:</strong> {patientInfo.name}</p>}
            {patientInfo.email && <p><strong>Email:</strong> {patientInfo.email}</p>}
            {patientInfo.phone && <p><strong>Phone:</strong> {patientInfo.phone}</p>}
          </div>
        )}
      </div>

      {/* Patient Information Popup */}
      {showPatientPopup && (
        <div className="patient-popup-overlay">
          <div className="patient-popup">
            <div className="popup-header">
              <h3>Patient Information</h3>
              <button className="close-popup" onClick={togglePatientPopup}>
                &times;
              </button>
            </div>
            <div className="popup-content">
              <div className="input-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  placeholder="Enter patient name"
                  value={patientInfo.name}
                  onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={patientInfo.email}
                  onChange={(e) => handlePatientInfoChange('email', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={patientInfo.phone}
                  onChange={(e) => handlePatientInfoChange('phone', e.target.value)}
                />
              </div>
              <button className="save-patient-btn" onClick={savePatientInfo}>
                Save Information
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="composer-container">
        <div className="composer-content">
          {/** Empty content **/}
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
            /** actually has content **/
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
          disabled={items.length === 0}
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
