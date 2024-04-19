import { useEffect, useState } from 'react';

export const useFetchMessages = (receiver: string, submitted: boolean) => {
    const [textMessages, setTextMessages] = useState([{
        message_from: "",
        message: ""
    }])
    const [receiverName, setReceiverName] = useState("")
    const [receiverProfilePic, setReceiverProfilePic] = useState("")
    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)

    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch("http://localhost:4000/retrieve_messages", {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({receiver: receiver}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                setError(false)
                setTextMessages(data)
            } else {
                setPending(false)
                setError(true)
            }
        }
        const fetchReceiverDetails = async () => {
            const res = await fetch(`http://localhost:4000/profile`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({username: receiver}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                setPending(false)
                setError(false)
                setReceiverName(data.first_name)
                setReceiverProfilePic(data.uri)
            } else {
                setPending(false)
                setError(true)
            }
        }

        fetchMessages()
        fetchReceiverDetails()
    }, [receiver])

    useEffect(() => {
        if (submitted) {
            const fetchUpdatedMessages = async () => {
                const res = await fetch("http://localhost:4000/retrieve_messages", {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({receiver: receiver}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    setError(false)
                    setTextMessages(data)
                } else {
                    setPending(false)
                    setError(true)
                }
            }
            fetchUpdatedMessages()
        }
    }, [submitted, receiver])

    return { messages: textMessages, receiver_profile_pic: receiverProfilePic, receiver_name: receiverName, pending: pending, error: error }
}