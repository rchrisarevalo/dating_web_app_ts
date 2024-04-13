import { useEffect, useState } from "react";
import { MatchProfiles } from "../types/types.config";

export const useFetchAlgoConfig = (endpoint: string, auth: boolean) => {
    const [algoConfig, setAlgoConfig] = useState(false)
    const [soFilterUsed, setSOFilterUsed] = useState(false)
    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (auth) {
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
    
                setPending(false)
                setError(false)
            }).catch((error) => {
                setPending(false)
                setError(true)
                console.log(error)
            })
        }
    }, [endpoint, auth])

    return { algo_config: algoConfig, use_so_filter: soFilterUsed, algo_pending: pending, algo_error: error }
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

export const useFetchProfiles = (endpoint: string, auth: boolean) => {
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
        if (auth)
        {
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
                setPending(false)
                setProfiles(data)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
    }, [endpoint, auth])

    return { profiles, pending, error }
}

export const useFetchMatches = (match_endpoint: string, 
                                use_so_filter: boolean, 
                                algo_config: boolean) => {
    
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
        const user_data = {
            use_so_filter: use_so_filter,
            algo_config: algo_config,
            initial_limit: 100
        }

        // Then submit a request to the REST API to match the user profiles with the current user's profile.
        fetch('http://localhost:5000/match', {
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
    }, [match_endpoint, use_so_filter])

    // Return the matched profiles in an array full of objects, as well as the request status.
    return { matchedProfiles, pending, error }
}