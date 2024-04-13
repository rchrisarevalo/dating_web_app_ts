import { useEffect, useState } from 'react';

export const useFetchLogin = () => {
    const [auth, setAuth] = useState(false)
    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)
    const [username, setUsername] = useState("")
    const [profilePic, setProfilePic] = useState("")
    const [returnStatus, setReturnStatus] = useState(200)

    useEffect(() => {
        fetch("http://localhost:5000/check_login", {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) {
                return res.json()
            } else {
                setReturnStatus(res.status)
                throw res.status
            }
        }).then((data) => {
            setAuth(true)
            setPending(false)
            setError(false)
            setUsername(data.username)
            setProfilePic(data.profile_pic)
        }).catch((error) => {
            if (error == 401) {
                setAuth(false)
                setPending(false)
                setError(false)
            } else {
                setAuth(false)
                setPending(false)
                setError(true)
            }
        })
    }, [])

    return { auth: auth, pending: pending, error: error, username: username, profile_pic: profilePic, status_code: returnStatus }
}