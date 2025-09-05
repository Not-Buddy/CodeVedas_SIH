import "./Results.css"

const results = {
    tags: ["TM2-1234","ICD-5678","RA","Rheumatoid Disease"],
    head: "Amavata (Rheumatoid Arthritis)",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima animi porro aliquid hic nemo id, neque ea assumenda rem similique reprehenderit? Animi quae nam esse saepe commodi non impedit obcaecati."
}

const Results = () => {
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

                {results.tags.slice(2).map((tag, index) =>{
                    return(
                    <p>{tag}</p>
                    );
                })}
            </div>

            <div className="text">
                <h2>{results.head}</h2>
                <p>{results.desc}</p>
            </div>

            <div className="buttons">
                <button>Copy ICD-11 TM2 Code</button>
                <button>Copy NAMASTE Code</button>
                <button id="add-button">Add to Composer</button>
            </div>
        </div>
    </>
    );
};

export default Results;