import "./Results.css"

const results = {
    tags: ["TM2-1234","ICD-5678","RA","Rheumatoid Disease"],
    head: "Amavata (Rheumatoid Arthritis)",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima animi porro aliquid hic nemo id, neque ea assumenda rem similique reprehenderit? Animi quae nam esse saepe commodi non impedit obcaecati."
}

const Results = ({result}) => {
    return(
    <>
        <div className="outer">
            <div className="tags">
                <div>
                    <span className="label">NAMASTE</span>
                    <div>
                    <p>{results.tags[0]}</p>
                    </div>
                </div>

                <div>
                    <span className="label">ICD-11</span>
                    <div>
                    <p>{results.tags[1]}</p>
                    </div>
                </div>

                {results.tags.slice(2).map((tag, index) => {
                    return(
                    <p key={index}>{tag}</p>
                    );
                })}
            </div>

            <div className="text">
                <h2>{results.head}</h2>
                <p>{results.desc}</p>
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