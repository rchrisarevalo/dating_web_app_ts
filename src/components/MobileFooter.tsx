import { Link, useLocation } from 'react-router-dom'
import {
    IoSearchOutline,
    IoBanOutline,
    IoSendOutline,
    IoMailOutline
} from "react-icons/io5"
import { ProfilePicture } from './ProfilePicture'

// Properties defined for MobileFooter component.
interface MobileFooterProps {
    username: string,
    blocked: boolean,
    chat_request_approved: boolean
}

// Will be used for other profile user's pages and the
// mobile version of the 'Settings' page.
export const MobileFooter = (props: MobileFooterProps) => {
    const { username, blocked, chat_request_approved } = props

    const path = useLocation()
    const retrieve_username_from_path = path.pathname.split("/user/")[1]

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
                {chat_request_approved && <li><Link to={`/message/${retrieve_username_from_path}`}><IoSendOutline size={30} />Message</Link></li>}
                <li><Link to={`/profile/follow_requests`}><IoMailOutline size={30} />Chat Requests</Link></li>
                <li><Link to={`/profile/search`}><IoSearchOutline size={30} />Search</Link></li>
                <li><Link onClick={handleBlockUserMobile} to={''}><IoBanOutline size={30} />Block</Link></li>
                <li><Link to={`/profile/`}><ProfilePicture /></Link></li>
            </footer>
        </>
    )
}