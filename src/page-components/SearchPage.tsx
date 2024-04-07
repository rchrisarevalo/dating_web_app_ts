import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IoFunnelOutline, IoHelpOutline, IoSearchOutline, IoTrashBinOutline } from 'react-icons/io5'

import { useFetchAlgoConfig, useFetchSearchHistory, useFetchMatches } from "../hooks/useFetchSearch"
import { FilteredSearchResults } from '../components/FilteredSearchResults'

import { clearSearchTerm, insertSearchTerm } from '../functions/searchHistoryFunctions'

import Spinner from 'react-bootstrap/Spinner'

import { MatchProfiles } from '../types/types.config'

interface SearchPageProps {
    user_profiles: {
        profiles: MatchProfiles[],
        pending: boolean,
        error: boolean
    },
    visited_profiles: {
        profiles: MatchProfiles[],
        pending: boolean,
        error: boolean
    },
    current_profile: {
        profiles: MatchProfiles[],
        pending: boolean,
        error: boolean
    }
}

export const SearchPage = (props: SearchPageProps) => {

    const { user_profiles, visited_profiles, current_profile } = props

    const { algo_config, use_so_filter } = useFetchAlgoConfig("http://localhost:5000/privacy/check_recommendation_settings")
    const { search_history, pending, error } = useFetchSearchHistory("http://localhost:5000/retrieve_search_history")

    const matched_profiles = useFetchMatches(user_profiles.profiles,
        visited_profiles.profiles,
        current_profile.profiles,
        user_profiles.pending,
        visited_profiles.pending,
        current_profile.pending,
        user_profiles.error,
        visited_profiles.error,
        current_profile.error,
        use_so_filter,
        "http://localhost:5000/match")

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
        if (algo_config) {
            if (!matched_profiles.pending && !matched_profiles.error) {
                setResults(matched_profiles.matchedProfiles)
            }
        }
        else {
            if (!user_profiles.pending && !user_profiles.error) {
                setResults(user_profiles.profiles)
            }
        }
    }, [matched_profiles.error, matched_profiles.pending, matched_profiles.matchedProfiles,
        algo_config, user_profiles.error, user_profiles.pending, user_profiles.profiles])

    return (
        <div className="search-page-container">
            <div className="search-page-row">
                <h1>SEARCH FOR USER</h1>
                <br></br>
                {(!pending && !matched_profiles.pending && !user_profiles.pending) ?
                    <>
                        {(!error && !matched_profiles.error && !user_profiles.pending) ?
                            <>
                                <form className="search-page-col" onSubmit={(e) => e.preventDefault()}>
                                    <input id="search-input" type="search" placeholder="Enter a search term..." value={currentSearchTerm} onChange={(e) => setCurrentSearchTerm(e.target.value)} autoComplete='off' required />
                                    <IoFunnelOutline size={30} style={{ marginLeft: '10px', marginRight: '10px', cursor: 'pointer' }} />
                                    <IoHelpOutline size={30} style={{ marginLeft: '10px', marginRight: '10px', cursor: 'pointer' }} title={algo_config ? 'You will receive matched users in your results.' : 'You will receive regular search results.'} />
                                </form>
                                <br></br>
                                {!currentSearchTerm ?
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
                                                                <div id="user-profile-figure-container">
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
                                    :
                                    <>
                                        <FilteredSearchResults search_term={currentSearchTerm} profiles={user_profiles} matchedProfiles={matched_profiles} algo_config={algo_config} />
                                    </>
                                }
                            </>
                            :
                            <div className="loading-match-page">
                                <p>Error!</p>
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