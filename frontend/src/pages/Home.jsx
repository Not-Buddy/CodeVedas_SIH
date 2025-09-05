import {useState, React} from "react";
import  axios from 'axios';
import Navbar from "../components/navbar/Navbar.jsx";
import Results from "../components/results/Results.jsx";
import SearchBar from "../components/globalsearch/searchbar.jsx";

const HomePage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // async function to call api
    const handleSearchSubmit = async (searchData) => {
        const { query, filters } = searchData;
        
        const params = new URLSearchParams();
        params.append('search', query);

        if (filters.discipline.length > 0) {
        params.append('discipline', filters.discipline[0].toLowerCase());
        }
        params.append('limit', '5');

        const apiUrl = `http://127.0.0.1:8080/icd/search?${params.toString()}`;
        
        console.log('Constructed API URL:', apiUrl); 
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(apiUrl);
            console.log(response.data);
            setSearchResults(response.data);
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
        <div style={{margin: "0 7em"}}>
            <Navbar />
            <SearchBar onSubmit={handleSearchSubmit} onClear={handleClear} />
            <div style={{display: "flex", flexDirection: "row"}}>
                <div className="left" style={{display: "flex", flexDirection: "column", width: "60%"}}>
                    <Results />
                </div>
                <div className="right" style={{display: "flex", flexDirection: "row", width: "40%"}}>

                </div>

            </div>
        </div>
    );
};

export default HomePage;