import {useState, React} from "react";
import  axios from 'axios';
import Navbar from "../components/navbar/Navbar.jsx";
import Results from "../components/results/Results.jsx";
import SearchBar from "../components/globalsearch/searchbar.jsx";
import Composer from "../components/composer/Composer.jsx";

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

    //curl "http://127.0.0.1:8080/terminology/search?search=fever&limit=10"
    // async function to call api
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
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };  

    const handleClear = () => {
        setSearchResults(null);
    };

    return(
        // MODIFICATION: Changed 'margin' to 'padding' for better page width control.
        // ^ No keep the margin please T-T
        <div style={{margin: "0 7em", height: "100vh", display: "flex", flexDirection: "column"}}>
            <Navbar />
            <div style={{display: "flex", flexDirection: "row", flexGrow: 1, overflow: "hidden"}}>
                <div className="left" style={{display: "flex", flexDirection: "column", width: "60%"}}>
                    <SearchBar onSubmit={handleSearchSubmit} onClear={handleClear} />
                    <div className="results-container" style={{flexGrow: 1, overflowY: "auto"}}>
                        {!loading && searchResults && searchResults.length === 0 && (
                            <EmptyState />
                        )}
                        {!loading && searchResults && searchResults.length > 0 && (
                            searchResults.map((result) => (
                                <Results key={result.id} item={result} />
                            ))
                        )}
                    </div>
                </div>
                <div className="right" style={{display: "flex", flexDirection: "row", width: "40%", justifyContent: "center"}}>
                    <Composer />
                </div>

            </div>
        </div>
    );
};

export default HomePage;