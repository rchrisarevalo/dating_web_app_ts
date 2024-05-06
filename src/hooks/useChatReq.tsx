import React, { useEffect, useState } from 'react'
import { CurrentRequestStatus, ChatReq } from '../types/types.config'
import { socket_conn } from '../functions/SocketConn'

export const useSendChatReq = (requestee: string, 
                               request: CurrentRequestStatus,
                               setRequest: React.Dispatch<React.SetStateAction<CurrentRequestStatus>>) => {

    useEffect(() => {
        if (request.made) {
            const sendChatReq = async () => {
                const res = await fetch('http://localhost:5000/privacy/make_chat_request', {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({
                        requestee: requestee
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
    
                if (res.ok) {
                    socket_conn.emit('chat-request', requestee)
                    setRequest({...request, made: false, is_requestor: true, sent: true})
                } else {
                    setRequest({...request, made: false, sent: false})
                }
            }
    
            const deleteChatReq = async () => {
                const res = await fetch('http://localhost:5000/privacy/delete_chat_request', {
                    method: 'PUT',
                    credentials: 'include',
                    body: JSON.stringify({
                        requestee: requestee
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
    
                if (res.ok) {
                    socket_conn.emit('chat-request', requestee)
                    setRequest({...request, made: false, sent: false, approved: false})
                } else {
                    setRequest({...request, made: false, sent: false, approved: false})
                }
            }
            
            if (request.type == "send") {
                sendChatReq()
            } else if (request.type == "remove") {
                deleteChatReq()
            }

            setRequest({...request, type: "", made: false})
        }
    }, [request.made, request, requestee, setRequest])
}

export const useFetchChatReqStatus = (requestee: string, 
                                      setRequest: React.Dispatch<React.SetStateAction<CurrentRequestStatus>>,
                                      connection: typeof socket_conn) => {

    const [pending, setPending] = useState(true)
    const [error, setError] = useState(false)
    
    useEffect(() => {
        const fetchChatReq = async () => {
            const res: Response = await fetch('http://localhost:4000/privacy/fetch_chat_req_status', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    requestee: requestee
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.ok) {
                const data: CurrentRequestStatus = await res.json()
                setRequest(data)
                setPending(false)
            } else {
                setPending(false)
                setError(true)
            }
        }

        fetchChatReq()

        if (connection.active) {
            connection.on('update-chat-request', () => {
                fetchChatReq()
            })
        }

        return () => {
            connection.off('update-chat-request')
        }
    }, [requestee, setRequest, connection])

    return { chat_req_loading: pending, chat_req_error: error }
}

export const useFetchReqCount = (endpoint: string, connection: typeof socket_conn) => {
    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)
    const [reqCount, setReqCount] = useState(0)

    useEffect(() => {
        const fetchReqCount = async () => {
            const res = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
            })

            if (res.ok) {
                const data = await res.json()
                console.log(data)
                setReqCount(data.request_count)
                setPending(false)
            } else {
                setPending(false)
                setError(true)
            }
        }
        fetchReqCount()

        if (connection.active) {
            connection.on('update-chat-request', () => {
                fetchReqCount()
            })
        }

        return () => {
            connection.off('update-chat-request')
        }
    }, [endpoint, connection])

    return { req_count: reqCount, req_pending: pending, req_error: error }
}

export const useFetchChatReqs = (endpoint: string, connection: typeof socket_conn) => {
    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)

    const [chatReqs, setChatReqs] = useState<ChatReq[]>([])

    useEffect(() => {
        const fetchChatReqs = async () => {
            const res = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
            })

            if (res.ok) {
                setPending(false)
                const data = await res.json()
                setChatReqs(data)
            } else {
                setPending(false)
                setError(true)
            }
        }
        fetchChatReqs()

        if (connection.active) {
            connection.on('update-chat-request', () => {
                fetchChatReqs()
            })
        }

        return () => {
            connection.off('update-chat-request')
        }
    }, [endpoint, connection])

    return { chat_reqs: chatReqs, chat_reqs_pending: pending, chat_reqs_error: error }
}