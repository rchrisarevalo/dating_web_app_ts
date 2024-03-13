import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from './Loading'
import { insertSearchTerm } from '../functions/searchHistoryFunctions'

import { MatchProfiles } from '../types/types.config'

interface FilteredSearchResultsProps {
    search_term: string,
    profiles: {
        profiles: MatchProfiles[],
        pending: boolean,
        error: boolean
    },
    matchedProfiles: {
        matchedProfiles: MatchProfiles[],
        pending: boolean,
        error: boolean
    }
    algo_config: boolean
}

export const FilteredSearchResults = (props: FilteredSearchResultsProps) => {
    const { search_term, profiles, matchedProfiles, algo_config } = props

    const [filteredResults, setFilteredResults] = useState([{
        age: 0,
        city_residence: "",
        first_name: "",
        interests: "",
        state_residence: "",
        uri: "",
        username: ""
    }])

    useEffect(() => {
        if (algo_config) {
            setFilteredResults(matchedProfiles.matchedProfiles.filter(result => (search_term.toLowerCase().substring(0, search_term.length)) === (result.first_name.toLowerCase().substring(0, search_term.length))))
        } else {
            setFilteredResults(profiles.profiles.filter(result => (search_term.toLowerCase().substring(0, search_term.length)) === (result.first_name.toLowerCase().substring(0, search_term.length))))
        }
    }, [profiles.profiles, matchedProfiles.matchedProfiles, algo_config, search_term])

    return (
        <>
            {!profiles.pending ?
                <>
                    {!profiles.error ? 
                        <>
                            {filteredResults.length !== 0 ?
                                <>
                                    {filteredResults.map((result, i) =>
                                        <>
                                            {typeof(result) !== "undefined" &&
                                                <>
                                                    <figure id="new-card" key={`profile-${i}`}>
                                                        <div id="new-card-image">
                                                            <img src={`data:image/png;base64,${result.uri}`} alt="search-profile-pic"></img>
                                                        </div>
                                                        <br></br>
                                                        <div id="user-profile-figure-container">
                                                            <h3>{`${result.first_name}, ${result.age}`}</h3>
                                                            <p id="user-profile-details">{`${result.city_residence}, ${result.state_residence}`}</p>
                                                            <p id="user-profile-details">{`${result.interests}`}</p>
                                                            <Link to={`/user/${result.username}`} onClick={() => insertSearchTerm()}>View</Link>
                                                        </div>
                                                    </figure>
                                                    <br></br>
                                                    <br></br>
                                                </>
                                            }
                                        </>
                                    )}
                                </>
                                :
                                <h5 style={{marginTop: '50px'}}>There are no search results to display.</h5>
                            }
                        </>
                        :
                        <Loading error={true} />
                    }
                </>
                :
                <Loading error={false} />
            }
        </>
    )
}