import { useState, useEffect } from 'react';
import { CurrentProfile } from '../types/types.config';

export const useFetchProfile = (auth: boolean, username: string) => {
    const [profile, setProfile] = useState<CurrentProfile>({
        username: "",
        name: "",
        age: 0,
        height: "",
        interests: "",
        sexual_orientation: "",
        relationship_status: "",
        uri: ""
    })

    // State variable that is used if error is detected.
    const [error, setError] = useState(false)

    // State variable that handles pending status.
    const [pending, setPending] = useState(true)

    // useEffect hook will use the user's username to retrieve basic
    // profile information, such as their name, bio, age, etc.
    useEffect(() => {
        if (auth)
        {
            const fetchProfile = async () => {
                const res = await fetch(`http://localhost:4000/profile/${username}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (res.ok) {
                    const data: CurrentProfile = await res.json()
                    setProfile(data)
                    sessionStorage.setItem("profile_pic", data.uri)
                    setPending(false)
                } else {
                    setPending(false)
                    setError(true)
                }
            }
            fetchProfile()
        }
    }, [auth])

    return { 
        profile_page: profile,
        profile_page_pending: pending, 
        profile_page_error: error,
        setProfile 
    }
}