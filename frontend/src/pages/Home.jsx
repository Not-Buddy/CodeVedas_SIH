import {useState, useEffect, React} from "react"; // MODIFICATION: Imported useEffect
import  axios from 'axios';
import Navbar from "../components/navbar/Navbar.jsx";
import Results from "../components/results/Results.jsx";
import SearchBar from "../components/globalsearch/searchbar.jsx";
import Composer from "../components/composer/Composer.jsx";
import { fallback } from "./fallback.js";

const EmptyState = () => (
    <div style={{marginTop: "2em", textAlign: "center", color: "#666"}}>
        <h2>No Results Found</h2>
        <p>We couldn't find any matches for your search. Please try a different term.</p>
    </div>
);

const HomePage = () => {
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [composerItems, setComposerItems] = useState([]);

    // MODIFICATION: Added state to manage the dark theme
    const [isDarkMode, setIsDarkMode] = useState(false);

    // MODIFICATION: This effect adds or removes the 'dark-theme' class from the body
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
            //setError('Failed to fetch data.'); 
            setSearchResults(fallback); 
        } finally {
            setLoading(false);
        }
    };  

    const handleClear = () => {
        setSearchResults(null);
    };

    // Composer functions
    const handleAddToComposer = (itemToAdd) => {
        // Prevent adding duplicates
        console.log(itemToAdd);
        if (!composerItems.some(item => (item.nam_code === itemToAdd.nam_code && item.icd_code === itemToAdd.icd_code))) {
            setComposerItems(prevItems => [...prevItems, itemToAdd]);
        }
    };

    const handleRemoveFromComposer = (itemToRemove) => {
    // remove by nam_code / fallback to icd_code if nam_code is null
    const keyToRemove = itemToRemove.nam_code != null ? 'nam_code' : 'icd_code';
    const valueToRemove = itemToRemove.nam_code != null ? itemToRemove.nam_code : itemToRemove.icd_code;

    setComposerItems(prevItems => prevItems.filter(item => item[keyToRemove] !== valueToRemove));
    };

    return(
        <div style={{margin: "0 7em", height: "100vh", display: "flex", flexDirection: "column"}}>
            {/* MODIFICATION: Pass theme state and toggle function to Navbar */}
            <Navbar isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

            <div style={{display: "flex", flexDirection: "row", flexGrow: 1, overflow: "hidden", gap: "2rem"}}> 
                <div className="left" style={{display: "flex", flexDirection: "column", width: "70%"}}>
                    <SearchBar onSubmit={handleSearchSubmit} onClear={handleClear} />
                    <div className="results-container" style={{flexGrow: 1, overflowY: "auto"}}>
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
                <div className="right" style={{display: "flex", flexDirection: "row", width: "30%", justifyContent: "flex-end"}}>
                    <Composer items={composerItems} onRemove={handleRemoveFromComposer}/>
                </div>

            </div>
        </div>
    );
};

export default HomePage;