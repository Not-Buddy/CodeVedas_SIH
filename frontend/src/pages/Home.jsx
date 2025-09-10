import { useState, useEffect } from "react";
import axios from 'axios';
import Navbar from "../components/navbar/Navbar.jsx";
import Results from "../components/results/Results.jsx";
import SearchBar from "../components/globalsearch/searchbar.jsx";
import Composer from "../components/composer/Composer.jsx";
import { fallback } from "./fallback.js";

const EmptyState = () => (
  <div style={{ 
    marginTop: "1rem", 
    textAlign: "center", 
    color: "#666",
    animation: "fadeIn 0.5s ease-in"
  }}>
    <h2 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}>No Results Found</h2>
    <p style={{ fontSize: "clamp(0.8rem, 2.5vw, 1rem)" }}>
      We couldn't find any matches for your search. Please try a different term.
    </p>
  </div>
);

const HomePage = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [composerItems, setComposerItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Toggle dark theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Search
  const handleSearchSubmit = async (searchData) => {
    const { query, filters } = searchData;
    
    const params = new URLSearchParams();
    params.append('search', query);

    if (filters.discipline.length > 0) {
      params.append('discipline', filters.discipline[0].toLowerCase());
    }
    params.append('limit', '7');

    const apiUrl = `http://127.0.0.1:8080/terminology/search?${params.toString()}`;
    
    console.log('Constructed API URL:', apiUrl); 
    
    setLoading(true);
    try {
      const response = await axios.get(apiUrl);
      console.log(response.data.results);
      setSearchResults(response.data.results);
    } catch (err) {
      console.log("API call failed. Using fallback data.", err);
      setSearchResults(fallback); 
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => setSearchResults(null);

  // Composer actions
  const handleAddToComposer = (item) => {
    console.log("Adding to composer:", item);
    if (
      !composerItems.some(
        (i) => i.nam_code === item.nam_code && i.icd_code === item.icd_code
      )
    ) {
      setComposerItems((prev) => [...prev, item]);
    }
  };

  const handleRemoveFromComposer = (itemToRemove) => {
    const key = itemToRemove.nam_code ? "nam_code" : "icd_code";
    setComposerItems((prev) =>
      prev.filter((item) => item[key] !== itemToRemove[key])
    );
  };

  const clearComposer = () => {
    setComposerItems([]);
    setIsComposerExpanded(false);
  };

  const toggleComposer = () => setIsComposerExpanded((prev) => !prev);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .result-item {
          animation: slideInLeft 0.3s ease-out;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .composer-desktop {
            display: none !important;
          }
        }
        
        @media (min-width: 769px) {
          .composer-mobile {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        margin: "0 clamp(1rem, 5vw, 7em)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        paddingBottom: isMobileView ? (isComposerExpanded ? "60vh" : "50px") : "0"
      }}>
        <Navbar isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

        <div style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          gap: "2rem",
          overflow: "hidden"
        }}>
          <div className="left" style={{
            display: "flex",
            flexDirection: "column",
            width: isMobileView ? "100%" : "70%",
            flex: isMobileView ? "1" : "2 1 70%"
          }}>
            <SearchBar onSubmit={handleSearchSubmit} onClear={handleClear} />
            <div className="results-container" style={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "0.5rem",
              maxHeight: isMobileView ? "calc(100vh - 200px)" : "calc(100vh - 150px)"
            }}>
              {!loading && searchResults && searchResults.length === 0 && (
                <EmptyState />
              )}
              {!loading && searchResults && searchResults.length > 0 && (
                searchResults.map((result, index) => (
                  <div 
                    key={result.id} 
                    className="result-item"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationFillMode: "both"
                    }}
                  >
                    <Results item={result} handleAddToComposer={handleAddToComposer}/>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Composer - hidden on mobile */}
          {!isMobileView && (
            <div className="composer-desktop" style={{
              display: "flex",
              flexDirection: "column",
              width: "30%",
              minWidth: "300px",
              flex: "1 1 30%"
            }}>
              <Composer
                items={composerItems}
                onRemove={handleRemoveFromComposer}
              />
            </div>
          )}
        </div>

        {/* Mobile Composer - hidden on desktop */}
        {isMobileView && (
          <div
            className="composer-mobile"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: "#57D24B",
              borderTop: "1px solid #57D24B",
              boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.1)",
              transition: "height 0.3s ease",
              height: isComposerExpanded ? "60vh" : "50px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                height: "50px",
                cursor: composerItems.length > 0 ? "pointer" : "default",
              }}
              onClick={composerItems.length > 0 ? toggleComposer : undefined}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {composerItems.length > 0 && (
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "white",
                      marginRight: "0.5rem",
                      fontSize: "1rem",
                      transition: "transform 0.3s ease",
                      transform: isComposerExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                )}
                <span style={{ fontWeight: "bold", color: "white" }}>
                  {composerItems.length === 0
                    ? "Composer (Empty)"
                    : `Composer (${composerItems.length} ${
                        composerItems.length === 1 ? "item" : "items"
                      })`}
                </span>
              </div>
              {composerItems.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearComposer();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {isComposerExpanded && composerItems.length > 0 && (
              <div
                style={{
                  height: "calc(100% - 50px)",
                  overflowY: "auto",
                  padding: "1rem",
                  backgroundColor: isDarkMode ? "#0D0D0D" : "white",
                }}
              >
                <Composer
                  items={composerItems}
                  onRemove={handleRemoveFromComposer}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;