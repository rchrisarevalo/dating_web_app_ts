import { useEffect, useState } from 'react'
import { socket_conn } from '../functions/SocketConn'

export const useFetchUserTyping = (username: string, message: string, socket: typeof socket_conn) => {
    const [userTyping, setUserTyping] = useState(false)

    // eslint-disable-next-line no-unused-vars
    const [userSocket] = useState(socket)

    useEffect(() => {
        if (userSocket.active) {
            userSocket.emit('user-typing-msg', username, message)
        }
    }, [userSocket, username, message])

    useEffect(() => {
        if (userSocket.active) {
            userSocket.on('user-is-typing-msg', (_username, message) => {
                if (message.length !== 0) {
                    setUserTyping(true)
                    window.scrollTo(0, document.body.scrollHeight)
                } else {
                    setUserTyping(false)
                }
            })
        }

        return () => {
            userSocket.off('user-is-typing-msg')
        }
    }, [message, username, userSocket])

    return { sender_is_typing: userTyping }
}