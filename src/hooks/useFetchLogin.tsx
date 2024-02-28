import { useEffect, useState } from 'react';

export const useFetchLogin = () => {
    const [auth, setAuth] = useState(false)
    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)
    const [username, setUsername] = useState("")
    const [profilePic, setProfilePic] = useState("")
    const [returnStatus, setReturnStatus] = useState(200)

    useEffect(() => {
        const fetchLogin = async () => {
            const res = await fetch("http://localhost:5000/check_login", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            const data = await res.json()

            if (data["verified"]) {
                setAuth(true)
                setPending(false)
                setError(false)
                setUsername(data["username"])
                setProfilePic(data["profile_pic"])
            } else {
                if (res.status === 401) {
                    setAuth(false)
                    setPending(false)
                    setError(false)
                } else {
                    setAuth(false)
                    setPending(false)
                    setError(true)
                }
                setReturnStatus(res.status)
            }
        }

        fetchLogin()
    }, [])

    return { auth: auth, pending: pending, error: error, username: username, profile_pic: profilePic, status_code: returnStatus }
}