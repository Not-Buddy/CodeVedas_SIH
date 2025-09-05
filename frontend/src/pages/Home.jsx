import React from "react";
import Navbar from "../components/Navbar/Navbar.jsx";
import Results from "../components/Results/Results.jsx";

const HomePage = () => {
    return(
        <div style={{margin: "0 7em"}}>
            <Navbar />

            <h1>Welcome to the SIH Project. This would be the home page.</h1>
            <div style={{display: "flex", flexDirection: "row"}}>
                <div className="left" style={{display: "flex", flexDirection: "column", width: "60%"}}>
                    <Results />
                    <Results />
                    <Results />
                </div>
                <div className="right" style={{display: "flex", flexDirection: "row", width: "40%"}}>

                </div>

            </div>
        </div>
    );
};

export default HomePage;