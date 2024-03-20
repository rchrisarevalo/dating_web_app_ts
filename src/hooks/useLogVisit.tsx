import { useEffect } from "react";

export const useLogVisit = (visiting_user: string) => {
    useEffect(() => {
        fetch('http://localhost:5000/visit', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                visiting_user: visiting_user
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) {
                return res.json()
            } else {
                throw res.status
            }
        }).catch((error) => {
            console.log(error)
        })
    }, [visiting_user])
}