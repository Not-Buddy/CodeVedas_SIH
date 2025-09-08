import React from "react";
import "./Navbar.css"

const Navbar = ({ isDarkMode, onToggleTheme }) => {
    return(
        <nav>
            <div className="left">
                <img src="/assets/Logo.png" alt="Our logo" width={70} height={70}/>
                <div className="left-text"> 
                    <h2>AyuSetu</h2>
                    <p>NAMASTE & ICD-11 Dual Coding Interface</p>
                </div>
            </div>
            <div className="right">
                <label className="theme-switch" htmlFor="theme-toggle-checkbox">
                  <input
                    type="checkbox"
                    id="theme-toggle-checkbox"
                    checked={isDarkMode}
                    onChange={onToggleTheme}
                  />
                  <div className="slider">
                    {/* MODIFICATION: Text now shows the current mode */}
                    <div className="switch-text">
                      {isDarkMode ? 'DARK MODE' : 'LIGHT MODE'}
                    </div>
                  </div>
                </label>

                <img id="ayush" src="/assets/MoA_logo.png" alt="Ministry of Ayush logo" width={70} height={70} />
                <img id="who" src="/assets/WHO_logo.png" alt="WHO logo" width={70} height={70} />
            </div>
        </nav>
    );
};

export default Navbar;