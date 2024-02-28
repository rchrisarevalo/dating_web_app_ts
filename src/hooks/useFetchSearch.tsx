import { useEffect, useState } from "react";
import { CalculateBirthday } from "../functions/CalculateBirthday";
import { MatchProfiles } from "../types/searchProfiles";

export const useFetchAlgoConfig = (endpoint: string) => {
    const [algoConfig, setAlgoConfig] = useState(false)
    const [soFilterUsed, setSOFilterUsed] = useState(false)

    useEffect(() => {
        const fetchAlgoConfig = async () => {
            fetch(endpoint, {
                method: 'POST',
                credentials: 'include'
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw res.status
                }
            }).then((data) => {
                if (data.used === "true") {
                    setAlgoConfig(true)
                } else {
                    setAlgoConfig(false)
                }

                if (data.use_so_filter === "true") {
                    setSOFilterUsed(true)
                } else {
                    setSOFilterUsed(false)
                }
            }).catch((error) => {
                console.log(error)
            })
        }
        fetchAlgoConfig()
    }, [endpoint])

    return { algo_config: algoConfig, use_so_filter: soFilterUsed }
}

export const useFetchSearchHistory = (endpoint: string) => {
    const [searchHistory, setSearchHistory] = useState([{
        search_term: ""
    }])

    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchSearchHistory = async () => {
            fetch(endpoint, {
                method: 'POST',
                credentials: 'include'
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw res.status
                }
            }).then((data) => {
                setSearchHistory(data)
                setPending(false)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
        fetchSearchHistory()
    }, [endpoint])

    return { search_history: searchHistory, pending: pending, error: error }
}

export const useFetchProfiles = (endpoint: string) => {
    const [profiles, setProfiles] = useState<MatchProfiles[]>([{
        age: 0,
        city_residence: "",
        first_name: "",
        interests: "",
        state_residence: "",
        uri: "",
        username: ""
    }])

    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchProfiles = async () => {
            fetch(endpoint, {
                method: 'POST',
                credentials: 'include'
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw res.status
                }
            }).then((data) => {
                // Include the age of the user to their profile object using their DOB.
                data.map((profile: { [x: string]: unknown; birth_month: string; birth_date: string; birth_year: string; }) => profile["age"] = CalculateBirthday(profile.birth_month, parseInt(profile.birth_date), parseInt(profile.birth_year)))
                setPending(false)
                setProfiles(data)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
        fetchProfiles()
    }, [endpoint])

    return { profiles, pending, error }
}

export const useFetchMatches = (userProfiles: MatchProfiles[], currentUserProfile: MatchProfiles[], 
                                usersPending: boolean, profilePending: boolean, 
                                usersError: boolean, profileError: boolean, 
                                use_so_filter: boolean, match_endpoint: string) => {
    
    // State variable to store the matched profiles.
    const [matchedProfiles, setMatchedProfiles] = useState<MatchProfiles[]>([{
        age: 0,
        city_residence: "",
        first_name: "",
        interests: "",
        state_residence: "",
        uri: "",
        username: ""
    }])

    // Status variables to keep track of request status whether it is currently
    // pending of if an error has occurred.
    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchMatches = async () => {
            // If the user profiles and the current user's profile are done loading...
            if (!usersPending && !profilePending) {
                // And if there are no errors loading two sets of profiles...
                if (!usersError && !profileError) {

                    // Object storing user's profiles, the profile of the logged in user,
                    // and the number of searches that will be retrieved.
                    const user_data = {
                        users: userProfiles,
                        logged_in_user: currentUserProfile,
                        use_so_filter: use_so_filter,
                        initial_limit: 100
                    }

                    // Then submit a request to the REST API to match the user profiles with the current user's profile.
                    fetch(match_endpoint, {
                        method: 'POST',
                        credentials: 'include',
                        body: JSON.stringify(user_data),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then((res) => {
                        if (res.ok) {
                            return res.json()
                        } else {
                            throw res.status
                        }
                    }).then((data) => {
                        setPending(false)
                        setMatchedProfiles(data[0])
                    }).catch((error) => {
                        console.log(error)
                        setPending(false)
                        setError(true)
                    })
                }
            }
        }
        fetchMatches()
    }, [match_endpoint, userProfiles, currentUserProfile, 
        profilePending, usersPending, usersError, 
        profileError, use_so_filter])

    // Return the matched profiles in an array full of objects, as well as the request status.
    return { matchedProfiles, pending, error }
}