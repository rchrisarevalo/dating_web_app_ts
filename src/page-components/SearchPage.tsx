import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { IoFunnelOutline, IoHelpOutline, IoSearchOutline, IoTrashBinOutline } from 'react-icons/io5'

import { useFetchSearchHistory, useFetchMatches } from "../hooks/useFetchSearch"

import { clearSearchTerm, insertSearchTerm } from '../functions/searchHistoryFunctions'

import Spinner from 'react-bootstrap/Spinner'
import { CurrentUserProfileContext } from '../components/Contexts'

export const SearchPage = () => {
    const profileContext = useContext(CurrentUserProfileContext)

    if (!profileContext) {
        throw new Error("This context cannot be loaded.")
    }

    const { algo_config, use_so_filter, algo_pending, algo_error } = profileContext
    const { search_history, pending, error } = useFetchSearchHistory("http://localhost:4000/retrieve_search_history")

    const matched_profiles = useFetchMatches("http://localhost:5000/match", use_so_filter, algo_config)

    const [currentSearchTerm, setCurrentSearchTerm] = useState("")
    const [results, setResults] = useState([{
        age: 0,
        city_residence: "",
        first_name: "",
        interests: "",
        state_residence: "",
        uri: "",
        username: ""
    }])
    const [searchHistory, setSearchHistory] = useState([{
        search_term: ""
    }])

    useEffect(() => {
        if (search_history.length !== 0 && !search_history, !pending && !error) {
            setSearchHistory(search_history)
        }
    }, [search_history, pending, error])

    useEffect(() => {
        if (!matched_profiles.pending && !matched_profiles.error && !algo_pending && !algo_error) {
            setResults(matched_profiles.matchedProfiles)
        }
    }, [matched_profiles.error, matched_profiles.pending, matched_profiles.matchedProfiles,
        algo_config, algo_error])

    useEffect(() => {
        if (currentSearchTerm !== "") {
            setResults(matched_profiles.matchedProfiles.filter(result => (currentSearchTerm.toLowerCase().substring(0, currentSearchTerm.length)) === (result.first_name.toLowerCase().substring(0, currentSearchTerm.length))))
        } else {
            setResults(matched_profiles.matchedProfiles)
        }
    }, [matched_profiles.matchedProfiles, currentSearchTerm])

    return (
        <div className="search-page-container">
            <div className="search-page-row">
                <h1>SEARCH FOR USER</h1>
                <br></br>
                {(!matched_profiles.pending && !pending && !algo_pending) ?
                    <>
                        {(!matched_profiles.error && !error && !algo_error) ?
                            <>
                                <form className="search-page-col" onSubmit={(e) => e.preventDefault()}>
                                    <input id="search-input" type="search" placeholder="Enter a search term..." value={currentSearchTerm} onChange={(e) => setCurrentSearchTerm(e.target.value)} autoComplete='off' required />
                                    <IoFunnelOutline size={30} style={{ marginLeft: '10px', marginRight: '10px', cursor: 'pointer' }} />
                                    <IoHelpOutline size={30} style={{ marginLeft: '10px', marginRight: '10px', cursor: 'pointer' }} title={algo_config ? 'You will receive matched users in your results.' : 'You will receive regular search results.'} />
                                </form>
                                <br></br>
                                <>
                                    {searchHistory.length !== 0 &&
                                        <>
                                            {searchHistory.map((term, i) =>
                                                <div id="search-history-link" key={`search-history-term-${i}`}>
                                                    {typeof (term.search_term) !== "undefined" &&
                                                        <>
                                                            <div id="search-history-term">
                                                                <input id={`search-term-${i}`} value={`${term.search_term}`} disabled></input>
                                                            </div>
                                                            <div id="search-history-options">
                                                                <button><IoSearchOutline size={30} style={{ cursor: 'pointer' }} onClick={() => setCurrentSearchTerm(term.search_term)} /></button>
                                                                <button onClick={() => clearSearchTerm(i, setSearchHistory)}><IoTrashBinOutline size={30} style={{ cursor: 'pointer' }} /></button>
                                                            </div>
                                                        </>
                                                    }
                                                </div>
                                            )}
                                        </>
                                    }
                                    <br></br>
                                    <>
                                        {results.length !== 0 ?
                                            <>
                                                {results.map((result, i) =>
                                                    <>
                                                        <figure id="new-card" key={`profile-${i}`}>
                                                            <div id="new-card-image">
                                                                <img src={`data:image/png;base64,${result.uri}`} alt="search-profile-pic"></img>
                                                            </div>
                                                            <br></br>
                                                            <div id="user-profile-figure-container" key={`user-profile-figure-${i}`}>
                                                                <h3>{`${result.first_name}, ${result.age}`}</h3>
                                                                <p id="user-profile-details">{`${result.city_residence}, ${result.state_residence}`}</p>
                                                                {result.interests.split("\n").map((paragraph) =>
                                                                    <p id="user-profile-details">
                                                                        <i>{`${paragraph}`}</i>
                                                                    </p>
                                                                )}
                                                                <Link to={`/user/${result.username}`} onClick={() => insertSearchTerm()}>View</Link>
                                                            </div>
                                                        </figure>
                                                        <br></br>
                                                        <br></br>
                                                    </>
                                                )}
                                            </>
                                            :
                                            <h5 style={{ marginTop: '50px' }}>There are no search results to display.</h5>
                                        }
                                    </>
                                </>
                            </>
                            :
                            <div className="loading-match-page">
                                <p>Failed to load or perform request. Please try again.</p>
                                <br></br>
                                <button style={{background: 'white', border: 'none', padding: '7px 30px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '900'}} onClick={() => window.location.reload()}>Reload Page</button>
                            </div>
                        }
                    </>
                    :
                    <div className="loading-match-page">
                        <Spinner animation='border' />
                        <p>Loading the best matches for you...</p>
                    </div>
                }
            </div>
        </div>
    )
}