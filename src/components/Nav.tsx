import { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { IoChatboxEllipsesOutline, IoSettingsOutline, IoSearchOutline, IoLogOutOutline, IoSendOutline, IoMailOutline } from "react-icons/io5"
import { ProfilePicture } from "./ProfilePicture";
import { socket_conn, py_conn } from "../functions/SocketConn";
import { NotificationCounter } from "./NotificationCounter";

import MediaQuery from "react-responsive";

// Interface containing navigation bar props.
interface NavProps {
    username: string,
    notificationCounter: number,
    chatRequestCounter: number,
    error: boolean,
    pending: boolean
    chat_request_error: boolean,
    chat_request_pending: boolean
}

interface UserNavProps {
    current_user_username: string,
    logged_in_user_username: string,
    blocked: boolean,
    chat_request_approved: boolean
}

export const Nav = (props: NavProps) => {
    const { username, notificationCounter, chatRequestCounter, error, pending, chat_request_error, chat_request_pending } = props

    const path = useLocation()

    // eslint-disable-next-line no-unused-vars
    const [connection] = useState(socket_conn)
    const [pyConn] = useState(py_conn)

    const handleLogout = () => {
        connection.emit('remove-user-socket-id', username)
        connection.disconnect()
        pyConn.disconnect()

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

    return (
        <>
            <MediaQuery minWidth={1024}>
                <nav className="profile-nav">
                    <div id="profile-nav-col">
                        <Link to={`/profile`}><ProfilePicture />{`\t\t ${username}`}</Link>
                    </div>
                    <div id="profile-nav-col">
                        <Link to={`/profile/options/`} rel="noreferrer"><IoSettingsOutline size={20} style={{ marginBottom: 2 }} /></Link>
                        <Link to={`/profile/recent_messages`}><NotificationCounter counter={notificationCounter} pending={pending} error={error} /><IoChatboxEllipsesOutline size={20} /></Link>
                        <Link to={`/profile/follow_requests`}><NotificationCounter counter={chatRequestCounter} pending={chat_request_pending} error={chat_request_error} /><IoMailOutline size={20} /></Link>
                        <Link to={`/profile/search`}><IoSearchOutline size={20} style={{ marginBottom: 2 }} /></Link>
                    </div>
                    <div id="profile-nav-col">
                        <Link onClick={handleLogout} to={""}><IoLogOutOutline size={20} style={{ marginRight: 10, marginBottom: 2 }} />Sign Out</Link>
                    </div>
                </nav>
            </MediaQuery>
            <MediaQuery maxWidth={1024}>
                <footer className="mobile-footer-menu">
                    {
                        /* 
                            To properly display user's footer navigation bar, their blocked status will be used instead of
                            their username. 
                        */
                    }
                    <li><Link to={`/profile/options`}><IoSettingsOutline size={30} />Settings</Link></li>
                    <li><Link to={"/profile/recent_messages"}><NotificationCounter counter={notificationCounter} error={error} pending={pending} /><IoChatboxEllipsesOutline size={30} />Messages</Link></li>
                    <li><Link to={`/profile/follow_requests`}><NotificationCounter counter={chatRequestCounter} pending={chat_request_pending} error={chat_request_error} /><IoMailOutline size={30} />Chat Requests</Link></li>
                    <li><Link to={`/profile/search`}><IoSearchOutline size={30} />Search</Link></li>
                    {((path.pathname !== '/profile') && (path.pathname !== '/profile/')) ?
                        <li><Link to={`/profile`}><ProfilePicture /></Link></li>
                        :
                        <li><Link onClick={handleLogout} to={""}><IoLogOutOutline size={30} />Sign Out</Link></li>
                    }
                </footer>
            </MediaQuery>
        </>
    )
}

export const UserNav = (props: UserNavProps) => {
    const { current_user_username, logged_in_user_username, blocked, chat_request_approved } = props

    const handleBlockUser = () => {
        fetch("http://localhost:5000/block", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                logged_in_user: logged_in_user_username,
                profile_user: current_user_username,
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

    return (
        <nav className="profile-nav">
            <div id="profile-nav-col">
                <Link to={`/profile/`}><ProfilePicture />{`\t\t ${sessionStorage.getItem("username")}`}</Link>
            </div>
            <div id="profile-nav-col">
                {(chat_request_approved) && <Link to={`/message/${current_user_username}`}><IoSendOutline size={20} style={{ marginBottom: 0.5 }} /></Link>}
                <Link to={`/profile/follow_requests`}><IoMailOutline size={20} /></Link>
                <Link to={`/profile/search`}><IoSearchOutline size={20} style={{ marginBottom: 3 }} /></Link>
            </div>
            <div id="profile-nav-col">
                <button style={{ background: 'rgb(30, 15, 87)', color: 'rgb(205, 44, 226)', border: 'none', borderRadius: '20px', padding: '5px 20px', fontWeight: '1000' }} onClick={handleBlockUser}>Block User</button>
            </div>
        </nav>
    )
}