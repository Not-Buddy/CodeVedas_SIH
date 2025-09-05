import "./Results.css"

const Results = ({item}) => {
    return(
    <>
        <div className="outer">
            <div className="tags">
                <div>
                    <span className="label">NAMASTE</span>
                    <div>
                    <p>don't have lol</p>
                    </div>
                </div>

                <div>
                    <span className="label">ICD-11</span>
                    <div>
                    <p>{item.code}</p>
                    </div>
                </div>
            </div>

            <div className="text">
                <h2>{item.title}</h2>
                <p>{item.definition || "No description available"}</p>
            </div>

            <div className="buttons">
                <button>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy ICD-11 TM2 Code
                </button>
                <button>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy NAMASTE Code
                </button>
                <button id="add-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add to Composer
                </button>
            </div>
        </div>
    </>
    );
};

export default Results;