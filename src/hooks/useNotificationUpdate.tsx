import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { socket_conn } from '../functions/SocketConn';

export const useNotificationUpdate = (currentUser: string, connection: typeof socket_conn) => {

    const [notificationCounter, setNotificationCounter] = useState(0)
    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)

    const path = useLocation()

    // Load current user's notification count in initial load.
    useEffect(() => {
        if (currentUser) {
            const retrieveNotificationCount = async () => {
                await fetch(`http://localhost:4000/retrieve_notification_count?username=${currentUser}`, {
                    method: 'GET',
                    credentials: 'include',
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
                    setError(false)
                    setNotificationCounter(data.notification_counter)
                }).catch((error) => {
                    setPending(false)
                    setError(true)
                    console.log(error)
                })
            }

            retrieveNotificationCount()
        }
    }, [currentUser, path])

    useEffect(() => {
        // NOTE:
        // The logic in the outer block occurs on the current logged in user's
        // side.
        //
        // The logic in the inner block(s) occurs when logged in user sends
        // message to another user, where it will then update the notification
        // counter on **their** side.
    
        // Update recipient user's notification counter if they are not in the recent messages page
        // or clear it if they are currently in it.
    
        if (connection.active) {
            connection.on('get-updated-notification-counter', (retrieve_username_from_path) => {
                // If the user is not in their recent messages page,
                // then update their notification counter.
                if (path.pathname !== "/profile/recent_messages") {
                    const retrieveNotificationCount = async () => {
                        await fetch(`http://localhost:4000/retrieve_notification_count?username=${retrieve_username_from_path}`, {
                            method: 'GET',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then((res) => {
                            if (res.ok) {
                                return res.json()
                            }
                        }).then((data) => {
                            setNotificationCounter(data.notification_counter)
                        }).catch((error) => {
                            console.log(error)
                        })
                    }
                    retrieveNotificationCount()
                }
    
                // If the user happens to be in their recent messages page,
                // then clear their notification counter.
                else if (path.pathname === "/profile/recent_messages") {
                    fetch(`http://localhost:5000/clear_notification_count?username=${retrieve_username_from_path}`, {
                        method: 'PUT',
                        credentials: 'include',
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
                        setNotificationCounter(data.notification_counter)
                    }).catch((error) => {
                        console.log(error)
                    })
                }
            })
        }
    
        // Clear the notification counter if the logged in user enters the
        // recent messages page.
        if (path.pathname === "/profile/recent_messages") {
            fetch(`http://localhost:5000/clear_notification_count?username=${currentUser}`, {
                method: 'PUT',
                credentials: 'include',
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
                setNotificationCounter(data.notification_counter)
            }).catch((error) => {
                console.log(error)
            })
        }
    
        // Cleanup function to run the connection only once
        // and to prevent a waste of resources.
        return () => {
            connection.off('get-updated-notification-counter')
        }
    }, [connection, path, currentUser])

    return { notification_counter: notificationCounter, notification_error: error, notification_pending: pending }
}