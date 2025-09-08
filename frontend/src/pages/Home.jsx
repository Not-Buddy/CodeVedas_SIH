import { useState, useEffect } from "react";
import axios from 'axios';
import Navbar from "../components/navbar/Navbar.jsx";
import Results from "../components/results/Results.jsx";
import SearchBar from "../components/globalsearch/searchbar.jsx";
import Composer from "../components/composer/Composer.jsx";
import { fallback } from "./fallback.js";

const EmptyState = () => (
    <div style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
        <h2 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)" }}>No Results Found</h2>
        <p style={{ fontSize: "clamp(0.8rem, 2.5vw, 1rem)" }}>
            We couldn't find any matches for your search. Please try a different term.
        </p>
    </div>
);

const HomePage = () => {
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [composerItems, setComposerItems] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [isComposerExpanded, setIsComposerExpanded] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [isDarkMode]);

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

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

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
        setError(null);
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

    const handleClear = () => {
        setSearchResults(null);
    };

    const handleAddToComposer = (itemToAdd) => {
        console.log(itemToAdd);
        if (!composerItems.some(item => (item.nam_code === itemToAdd.nam_code && item.icd_code === itemToAdd.icd_code))) {
            setComposerItems(prevItems => [...prevItems, itemToAdd]);
        }
    };

    const handleRemoveFromComposer = (itemToRemove) => {
        const keyToRemove = itemToRemove.nam_code != null ? 'nam_code' : 'icd_code';
        const valueToRemove = itemToRemove.nam_code != null ? itemToRemove.nam_code : itemToRemove.icd_code;

        setComposerItems(prevItems => prevItems.filter(item => item[keyToRemove] !== valueToRemove));
    };

    const toggleComposer = () => {
        setIsComposerExpanded(!isComposerExpanded);
    };

    const clearComposer = () => {
        setComposerItems([]);
    };

    return (
        <div style={{
            margin: "0 clamp(1rem, 5vw, 2rem)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            paddingBottom: isMobileView && composerItems.length > 0 ? (isComposerExpanded ? "40vh" : "50px") : "0"
        }}>
            <Navbar isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

            <div style={{
                display: "flex",
                flexDirection: isMobileView ? "column" : "row",
                flexGrow: 1,
                gap: "1rem",
                flexWrap: "wrap"
            }}> 
                <div className="left" style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    minWidth: "200px",
                    flex: isMobileView ? "none" : "2 1 60%"
                }}>
                    <SearchBar onSubmit={handleSearchSubmit} onClear={handleClear} />
                    <div className="results-container" style={{
                        flexGrow: 1,
                        overflowY: "auto",
                        padding: "0.5rem",
                        maxHeight: isMobileView ? "calc(100vh - 250px)" : "calc(100vh - 200px)"
                    }}>
                        {!loading && searchResults && searchResults.length === 0 && (
                            <EmptyState />
                        )}
                        {!loading && searchResults && searchResults.length > 0 && (
                            searchResults.map((result) => (
                                <Results key={result.id} item={result} handleAddToComposer={handleAddToComposer}/>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Desktop Composer - unchanged */}
                {!isMobileView && (
                    <div className="right" style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        minWidth: "200px",
                        flex: "1 1 30%",
                        justifyContent: "flex-start"
                    }}>
                        <Composer items={composerItems} onRemove={handleRemoveFromComposer}/>
                    </div>
                )}
            </div>

            {/* Mobile Composer Bar - only shown on mobile */}
            {isMobileView && composerItems.length > 0 && (
                <div style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: "#38A169", // Green background
                    borderTop: "1px solid #2F855A",
                    boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    height: isComposerExpanded ? "40vh" : "50px",
                    overflow: "hidden"
                }}>
                    {/* Composer Toggle Button */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        cursor: "pointer",
                        height: "50px",
                        boxSizing: "border-box"
                    }} onClick={toggleComposer}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{
                                fontWeight: "bold",
                                color: "white",
                                marginRight: "0.5rem",
                                fontSize: "1rem",
                                transition: "transform 0.3s ease",
                                transform: isComposerExpanded ? "rotate(180deg)" : "rotate(0deg)"
                            }}>
                                ▼
                            </span>
                            <span style={{
                                fontWeight: "bold",
                                color: "white",
                                fontSize: "1rem"
                            }}>
                                Composer ({composerItems.length} {composerItems.length === 1 ? 'item' : 'items'})
                            </span>
                        </div>
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
                                padding: "0.3rem 0.6rem",
                                borderRadius: "4px",
                                fontSize: "0.8rem"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                            Clear
                        </button>
                    </div>

                    {/* Composer Content */}
                    {isComposerExpanded && (
                        <div style={{
                            height: "calc(100% - 50px)",
                            overflowY: "auto",
                            padding: "1rem",
                            backgroundColor: isDarkMode ? "#2D3748" : "white"
                        }}>
                            <Composer items={composerItems} onRemove={handleRemoveFromComposer}/>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;