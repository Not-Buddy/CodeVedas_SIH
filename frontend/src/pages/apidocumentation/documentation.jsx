// documentation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './documentation.css';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const sectionRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  // Set up section refs
  const setSectionRef = (id, element) => {
    if (element) {
      sectionRefs.current[id] = element;
    }
  };

  useEffect(() => {
    // Handle direct navigation to a section via URL hash
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      if (hash && sectionRefs.current[hash]) {
        scrollToSection(hash, false);
      }
    };

    // Initial check for hash
    handleHashChange();

    // Set up scroll listener
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Find the current section
      let currentSection = 'overview';
      Object.entries(sectionRefs.current).forEach(([id, element]) => {
        if (element && scrollPosition >= element.offsetTop) {
          currentSection = id;
        }
      });
      
      setActiveSection(currentSection);
      
      // Update URL hash without causing navigation
      if (location.hash.replace('#', '') !== currentSection) {
        navigate(`#${currentSection}`, { replace: true });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location, navigate]);

  const scrollToSection = (sectionId, smooth = true) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const handleNavClick = (sectionId, e) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  const sections = ['overview', 'authentication', 'endpoints', 'codesystem', 'conceptmap', 'examples', 'compliance'];

  return (
    <div className="documentation">
      <header className="header">
        <div className="container">
          <h1>AyuSetu API Documentation</h1>
          <p>Integrate traditional Indian medicine terminology with global ICD-11 standards</p>
        </div>
      </header>

      <nav className="navbar">
        <div className="container">
          <ul>
            {sections.map(section => (
              <li key={section}>
                <a 
                  href={`#${section}`} 
                  className={activeSection === section ? 'active' : ''}
                  onClick={(e) => handleNavClick(section, e)}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="main container">
        <Section id="overview" title="Overview" ref={ref => setSectionRef('overview', ref)}>
          <p>
            AyuSetu API is a FHIR R4-compliant terminology micro-service that bridges India's NAMASTE codes with WHO ICD-11 
            standards (Traditional Medicine Module 2 and Biomedicine). This service enables dual-coding of Ayurveda, Siddha, 
            and Unani diagnoses for interoperability with global health systems.
          </p>
          
          <div className="features">
            <div className="feature-card">
              <h3>FHIR Compliance</h3>
              <p>Compliant with FHIR R4 standards and India's 2016 EHR requirements</p>
            </div>
            <div className="feature-card">
              <h3>Dual Coding</h3>
              <p>Map between NAMASTE codes and ICD-11 TM2/Biomedicine codes</p>
            </div>
            <div className="feature-card">
              <h3>Secure Access</h3>
              <p>OAuth 2.0 authentication with ABHA tokens</p>
            </div>
          </div>
        </Section>

        <Section id="authentication" title="Authentication" ref={ref => setSectionRef('authentication', ref)}>
          <p>
            All API endpoints require OAuth 2.0 authentication using ABHA (Ayushman Bharat Health Account) tokens. 
            Include your access token in the Authorization header of each request.
          </p>
          
          <CodeBlock>
{`// Example Authorization Header
Authorization: Bearer <your_access_token>

// Getting an access token
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET`}
          </CodeBlock>
        </Section>

        <Section id="endpoints" title="API Endpoints" ref={ref => setSectionRef('endpoints', ref)}>
          <Endpoint 
            method="GET" 
            title="ValueSet Lookup" 
            url="/ValueSet/$expand?url=urn:oid:namaste-codes&filter={search_term}"
            description="Search NAMASTE terms with auto-complete functionality. Returns matching concepts with their ICD-11 mappings."
          >
{`// Example Request
GET /ValueSet/$expand?url=urn:oid:namaste-codes&filter=fever

// Example Response
{
  "resourceType": "ValueSet",
  "expansion": {
    "contains": [{
      "system": "http://namaste-codes.org",
      "code": "NAMASTE-123",
      "display": "Jwara (Fever)",
      "designation": [{
        "value": "Fever"
      }]
    }]
  }
}`}
          </Endpoint>
          
          <Endpoint 
            method="POST" 
            title="Translate Operation" 
            url="/ConceptMap/$translate"
            description="Convert between NAMASTE and ICD-11 TM2 codes."
          >
{`// Example Request
POST /ConceptMap/$translate
{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "code",
    "valueCode": "NAMASTE-123"
  }, {
    "name": "system",
    "valueUri": "http://namaste-codes.org"
  }]
}

// Example Response
{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "result",
    "valueBoolean": true
  }, {
    "name": "message",
    "valueString": "Concept translated"
  }, {
    "name": "match",
    "part": [{
      "name": "equivalence",
      "valueCode": "equivalent"
    }, {
      "name": "concept",
      "valueCoding": {
        "system": "http://who.int/icd-11/tm2",
        "code": "TM2-456",
        "display": "Disorder characterized by fever"
      }
    }]
  }]
}`}
          </Endpoint>
          
          <Endpoint 
            method="POST" 
            title="Encounter Upload" 
            url="/"
            description="Upload FHIR Bundle containing encounter data with dual-coded diagnoses."
          >
{`// Example Request
POST /
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [{
    "resource": {
      "resourceType": "Encounter",
      "status": "finished",
      "class": {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "AMB",
        "display": "ambulatory"
      },
      "subject": {
        "reference": "Patient/123"
      },
      "reasonCode": [{
        "coding": [{
          "system": "http://namaste-codes.org",
          "code": "NAMASTE-123",
          "display": "Jwara (Fever)"
        }, {
          "system": "http://who.int/icd-11/tm2",
          "code": "TM2-456",
          "display": "Disorder characterized by fever"
        }]
      }]
    }
  }]
}`}
          </Endpoint>
        </Section>

        <Section id="codesystem" title="NAMASTE CodeSystem" ref={ref => setSectionRef('codesystem', ref)}>
          <p>
            The NAMASTE CodeSystem contains over 4,500 standardized terms for Ayurveda, Siddha and Unani disorders, 
            aligned with WHO Standardised International Terminologies for Ayurveda.
          </p>
          
          <CodeBlock>
{`{
  "resourceType": "CodeSystem",
  "url": "http://namaste-codes.org",
  "version": "2.1",
  "name": "NAMASTECodeSystem",
  "title": "National AYUSH Morbidity & Standardized Terminologies Electronic",
  "status": "active",
  "content": "complete",
  "concept": [{
    "code": "NAMASTE-123",
    "display": "Jwara (Fever)",
    "definition": "A disorder characterized by elevated body temperature...",
    "designation": [{
      "use": {
        "system": "http://who.int/icd-11/tm2",
        "code": "TM2-456"
      },
      "value": "Disorder characterized by fever"
    }]
  }]
}`}
          </CodeBlock>
        </Section>

        <Section id="conceptmap" title="ConceptMap for Mappings" ref={ref => setSectionRef('conceptmap', ref)}>
          <p>
            The ConceptMap resource defines mappings between NAMASTE codes and ICD-11 TM2/Biomedicine codes.
          </p>
          
          <CodeBlock>
{`{
  "resourceType": "ConceptMap",
  "url": "http://ayu-setu.org/ConceptMap/namaste-to-icd11",
  "version": "1.0",
  "name": "NAMASTEToICD11",
  "title": "NAMASTE to ICD-11 Mapping",
  "status": "active",
  "sourceScope": {
    "uri": "http://namaste-codes.org"
  },
  "targetScope": {
    "uri": "http://who.int/icd-11/tm2"
  },
  "group": [{
    "source": "http://namaste-codes.org",
    "target": "http://who.int/icd-11/tm2",
    "element": [{
      "code": "NAMASTE-123",
      "target": [{
        "code": "TM2-456",
        "equivalence": "equivalent"
      }]
    }]
  }]
}`}
          </CodeBlock>
        </Section>

        <Section id="examples" title="Integration Examples" ref={ref => setSectionRef('examples', ref)}>
          <h3>Web Application (JavaScript)</h3>
          <CodeBlock>
{`// Search for NAMASTE terms
async function searchNamasteTerms(searchTerm) {
  const response = await fetch(
    \`/ValueSet/$expand?url=urn:oid:namaste-codes&filter=\${encodeURIComponent(searchTerm)}\`,
    {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}

// Translate NAMASTE to ICD-11 TM2
async function translateCode(code, system) {
  const response = await fetch('/ConceptMap/$translate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resourceType: 'Parameters',
      parameter: [{
        name: 'code',
        valueCode: code
      }, {
        name: 'system',
        valueUri: system
      }]
    })
  });
  
  return await response.json();
}`}
          </CodeBlock>
        </Section>

        <Section id="compliance" title="Compliance Standards" ref={ref => setSectionRef('compliance', ref)}>
          <p>
            AyuSetu API is designed to comply with India's 2016 EHR Standards and international healthcare interoperability standards:
          </p>
          
          <ul>
            <li>FHIR R4 API compliant</li>
            <li>SNOMED CT and LOINC semantics</li>
            <li>ISO 22600 access control standards</li>
            <li>ABHA-linked OAuth 2.0 authentication</li>
            <li>Comprehensive audit trails for consent and versioning</li>
            <li>ICD-11 Coding Rules compliance</li>
          </ul>
        </Section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2023 AyuSetu API. All rights reserved.</p>
          <p>For support, contact: <a href="mailto:support@ayusetu.org">support@ayusetu.org</a></p>
        </div>
      </footer>
    </div>
  );
};

// Sub-components for better organization
const Section = React.forwardRef(({ id, title, children }, ref) => (
  <section id={id} className="section" ref={ref}>
    <h2>{title}</h2>
    {children}
  </section>
));

const CodeBlock = ({ children }) => (
  <div className="code-block">
    <pre>{children}</pre>
  </div>
);

const Endpoint = ({ method, title, url, description, children }) => (
  <div className="endpoint">
    <h3>{title}</h3>
    <div className={`method-${method.toLowerCase()}`}>{method}</div>
    <div className="endpoint-url">{url}</div>
    <p>{description}</p>
    <CodeBlock>{children}</CodeBlock>
  </div>
);

export default Documentation;