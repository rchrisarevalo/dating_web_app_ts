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
                method: 'GET',
                credentials: 'include',
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

    return { 
        algo_config: algoConfig, 
        use_so_filter: soFilterUsed, 
        algo_pending: pending, 
        algo_error: error,
        setAlgoConfig,
        setSOFilterUsed 
    }
}

export const useFetchSearchHistory = (endpoint: string) => {
    const [searchHistory, setSearchHistory] = useState([{
        search_term: ""
    }])

    const [pending, setPending] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        const fetchSearchHistory = async () => {
            const res = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
            })

            if (res.ok) {
                const data = await res.json()
                setSearchHistory(data)
                setPending(false)
            } else {
                setPending(false)
                setError(true)
            }
        }
        fetchSearchHistory()
    }, [endpoint])

    return { search_history: searchHistory, pending: pending, error: error }
}

export const useFetchRoutes = (endpoint: string, auth: boolean) => {
    const [profiles, setProfiles] = useState([{
        username: ""
    }])
    const [chatRoutes, setChatRoutes] = useState([{
        username: ""
    }])

    const [pending, setPending] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (auth)
        {
            const fetchUserRoutes = async () => {
                const res = await fetch(endpoint, {
                    method: 'GET',
                    credentials: 'include'
                })

                if (res.ok) {
                    const data = await res.json()
                    setPending(false)
                    setProfiles(data.user_routes)
                    setChatRoutes(data.chat_user_routes)
                } else {
                    setPending(false)
                    setError(true)
                }
            }

            fetchUserRoutes()
        }
    }, [endpoint, auth])

    return { profiles, chatRoutes, pending, error }
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
    const [pending, setPending] = useState<boolean>(true)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        const user_data = {
            use_so_filter: use_so_filter,
            algo_config: algo_config,
            initial_limit: 100
        }

        // Then submit a request to the REST API to match the user profiles with the current user's profile.
        const fetchMatches = async () => {
            const res = await fetch(match_endpoint, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(user_data),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                setPending(false)
                setMatchedProfiles(data[0])
            } else {
                setPending(false)
                setError(true)
            }
        }
        fetchMatches()
    }, [match_endpoint, use_so_filter])

    // Return the matched profiles in an array full of objects, as well as the request status.
    return { matchedProfiles, pending, error }
}