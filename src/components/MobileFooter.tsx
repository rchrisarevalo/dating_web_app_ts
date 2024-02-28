import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    IoChatboxEllipsesOutline, IoSettingsOutline,
    IoSearchOutline, IoLogOutOutline,
    IoBanOutline
} from "react-icons/io5"
import { ProfilePicture } from './ProfilePicture'
import { socket_conn } from '../functions/SocketConn'
import { NotificationCounter } from './NotificationCounter'

// Properties defined for MobileFooter component.
interface MobileFooterProps {
    username: string,
    blocked: boolean
}

// Will be used for other profile user's pages and the
// mobile version of the 'Settings' page.
export const MobileFooter = (props: MobileFooterProps) => {
    const { username, blocked } = props

    const path = useLocation()
    const retrieve_username_from_path = path.pathname.split("/user/")[1]

    const [notificationCounter, setNotificationCounter] = useState(0)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [connection] = useState(socket_conn)

    // Retrieve initial notification counter.
    useEffect(() => {
        if (!username) {
            fetch(`http://localhost:5000/retrieve_notification_count?username=${username}`, {
                method: 'POST',
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
    }, [username])

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
                    fetch(`http://localhost:5000/retrieve_notification_count?username=${retrieve_username_from_path}`, {
                        method: 'POST',
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
        } else {
            console.error("Cannot send message to user due to internet issues", 502)
        }

        // Clear the notification counter if the logged in user enters the
        // recent messages page.
        if (path.pathname === "/profile/recent_messages") {
            fetch(`http://localhost:5000/clear_notification_count?username=${username}`, {
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
    }, [connection, path.pathname, username])

    const handleLogout = () => {
        socket_conn.emit('remove-user-socket-id', username)
        socket_conn.disconnect()

        fetch("http://localhost:5000/logout", {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) {
                return res.json()
            }
        }).then(() => {
            sessionStorage.removeItem("username")
            sessionStorage.removeItem("profile_pic")
            window.location.href = "http://localhost:5173"
        }).catch((error) => {
            console.log(error)
        })
    }

    // ===============================================
    // For mobile version only.
    const handleBlockUserMobile = () => {
        fetch("http://localhost:5000/block", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                logged_in_user: username,
                profile_user: retrieve_username_from_path,
                block_requested: blocked
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
        }).then((data) => {
            console.log(data)
            window.location.reload()
        }).catch((error) => {
            console.log(error)
        })
    }
    // ===============================================

    return (
        <>
            <footer className="mobile-footer-menu">
                {
                    /* 
                        To properly display user's footer navigation bar, their blocked status will be used instead of
                        their username. 
                    */
                }
                {(typeof blocked !== "undefined") ?
                    <>
                        <li><Link to={`/message/${retrieve_username_from_path}`}><IoChatboxEllipsesOutline size={30} />Message</Link></li>
                        <li><Link to={`/profile/search`}><IoSearchOutline size={30} />Search</Link></li>
                        <li><Link onClick={handleBlockUserMobile} to={''}><IoBanOutline size={30} />Block User</Link></li>
                        <li><Link to={`/profile/`}><ProfilePicture /></Link></li>
                    </>
                    :
                    <>
                        <li><Link to={`/profile/options`}><IoSettingsOutline size={30} />Settings</Link></li>
                        <li><Link to={"/profile/recent_messages"}><NotificationCounter counter={notificationCounter} /><IoChatboxEllipsesOutline size={30} />Messages</Link></li>
                        <li><Link to={`/profile/search`}><IoSearchOutline size={30} />Search</Link></li>
                        {((path.pathname !== '/profile') && (path.pathname !== '/profile/')) ?
                            <li><Link to={`/profile`}><ProfilePicture /></Link></li>
                            :
                            <li><Link onClick={handleLogout} to={''}><IoLogOutOutline size={30} />Sign Out</Link></li>
                        }
                    </>
                }
            </footer>
        </>
    )
}