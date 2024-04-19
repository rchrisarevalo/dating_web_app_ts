import { useState, useEffect } from 'react';
import { CurrentProfile } from '../types/types.config';
import { CalculateBirthday } from '../functions/CalculateBirthday';

export const useFetchProfile = (auth: boolean) => {
    const [profile, setProfile] = useState<CurrentProfile>({
        username: "",
        name: "",
        age: 0,
        height: "",
        interests: "",
        sexual_orientation: "",
        relationship_status: "",
        profile_pic: ""
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
            fetch("http://localhost:4000/profile", {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({}),
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
                setProfile({
                    username: data.username,
                    name: `${data.first_name} ${data.middle_name} ${data.last_name}`,
                    age: CalculateBirthday(data.birth_month, parseInt(data.birth_date), parseInt(data.birth_year)),
                    height: data.height,
                    interests: data.interests,
                    sexual_orientation: data.sexual_orientation,
                    relationship_status: data.relationship_status,
                    profile_pic: data.uri
                })
                sessionStorage.setItem("profile_pic", data.uri)
                setPending(false)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
    }, [auth])

    return { 
        profile_page: profile, 
        profile_page_pending: pending, 
        profile_page_error: error 
    }
}