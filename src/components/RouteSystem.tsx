// Import hooks from 'react' library and custom hooks.
import { useEffect, useState } from "react";
import { useFetchLogin } from "../hooks/useFetchLogin";
import { useFetchRoutes } from "../hooks/useFetchSearch";

// Import necessary React Router DOM libraries to configure routes.
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Import components to create pages for both public and protected routes.
import { Loading } from "./Loading";
import { Login } from '../page-components/Login';
import { SignUp } from "../page-components/Signup";
import { Error404 } from '../page-components/Error404';
import { Profile } from "../page-components/Profile";
import { Options } from "../page-components/Options";
import { Update } from "../page-components/Update";
import { AccountSettings } from "../page-components/AccountSettings";
import { PrivacySettings } from "../page-components/PrivacySettings";
import { BlockedUsers } from "../page-components/BlockedUsers";
import { DownloadInfo } from "../page-components/DownloadInfo";
import { RecentMessages } from "../page-components/RecentMessages";
import { ViewChatReqs } from "../page-components/ViewChatReqs";
import { SearchPage } from "../page-components/SearchPage";
import { User } from "../page-components/User";
import { MessageUser } from "../page-components/MessageUser";
import { TOS } from "../page-components/TOS";
import { UserNotExist } from "./UserNotExist";

// Import socket connection.
import { socket_conn, py_conn } from "../functions/SocketConn";
import { Nav } from "./Nav";
import { CurrentUserProfileProvider } from "./Contexts";

// Interface for protected routes props.
interface RoutesProps {
    children: React.ReactNode
}

export const RoutingSystem = () => {
    const { auth, pending, error, username, profile_pic, status_code } = useFetchLogin()
    const profile_data = useFetchRoutes("http://localhost:4000/get_user_routes", auth)
    const path = useLocation().pathname
    const domain_path = path.split("/")[1]

    const [connection] = useState(socket_conn)
    const [pyConn] = useState(py_conn)

    // Connect socket connection if user is authenticated.
    useEffect(() => {
        // Connect the authenticated user to the socket if
        // their login has been verified.
        if (!pending && !error && auth) {
            connection.connect()
            pyConn.connect()
        } 
        
        // Otherwise, disconnect them from the socket.
        else {
            connection.disconnect()
            pyConn.disconnect()
        }

        // Connect the user to the socket to allow them to send real-time
        // messages to other users.
        connection.on('connect', () => {
            console.log("Connected!")
            connection.emit('store-user-socket-id', username, connection.id)
        })

        pyConn.on('connect', () => {
            console.log("Connected to Python socket!")
        })

        // Disconnect the user from the socket once they have logged out
        // or if their session.
        connection.on('disconnect', () => {
            console.log("Disconnected!")
            connection.emit('remove-user-socket-id', username)
        })


        pyConn.on('disconnect', () => {
            console.log("Disconnected!")
        })
        // Cleanup function to prevent the socket connection
        // from running more than once.
        return () => {
            connection.off('connect')
            pyConn.off('connect')
        }
    }, [connection, auth])

    const ProtectedRoutes = (props: RoutesProps) => {
        const { children } = props

        // This section is executed when the user navigates another page through
        // their browser's search bar or if they are opening their browser while
        // their session is currently valid.
        sessionStorage.setItem('username', username)
        sessionStorage.setItem('profile_pic', profile_pic)

        return (
            <>
                { (path !== "/tos" && domain_path !== "message" && domain_path !== "user") ?
                    <Nav username={username}/>
                    :
                    <></>
                }
                <Routes>
                    {children}
                </Routes>
            </>
        )
    }

    const PublicRoutes = (props: RoutesProps) => {
        const { children } = props

        return (
            <Routes>
                {children}
            </Routes>
        )
    }

    return (
        <>
            {!pending ?
                !error ?
                    !auth ?
                        <PublicRoutes>
                            <Route index path="/" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route path="/tos" element={<TOS />} />
                            <Route path="*" element={
                                (domain_path === "profile" || domain_path === "message" || domain_path === "user" ?
                                    <Navigate to="/" />
                                    :
                                    <Error404 errorInvoked={true} status_code={status_code} />
                                )
                            } />
                        </PublicRoutes>
                        :
                        !profile_data.pending ?
                            !profile_data.error ?
                                <CurrentUserProfileProvider auth={auth} username={username} connection={connection}>
                                    <ProtectedRoutes>
                                        <Route index path="/profile" element={
                                            <Profile />
                                        } />
                                        <Route path="/profile/options" element={<Options />} />
                                        <Route path="/profile/options/update" element={<Update username={username} />} />
                                        <Route path="/profile/options/settings" element={<AccountSettings username={username} /> } />
                                        <Route path="/profile/options/privacy" element={<PrivacySettings 
                                            username={username}
                                        />} />
                                        <Route path="/profile/options/privacy/view_blocked_users" element={<BlockedUsers />} />
                                        <Route path="/profile/options/privacy/download_information" element={<DownloadInfo />} />
                                        <Route path="/profile/recent_messages" element={<RecentMessages />} />
                                        <Route path="/profile/follow_requests" element={<ViewChatReqs />} />
                                        <Route path="/profile/search" element={<SearchPage />} />
                                        {profile_data.profiles.map((user: { username: string; }) => 
                                            <Route path={`/user/${user.username}`} element={<User username={user.username} />} />
                                        )}
                                        {profile_data.chatRoutes.map((user: { username: string; }) => 
                                            <Route path={`/message/${user.username}`} element={<MessageUser username={username} />} />
                                        )}
                                        <Route path="/tos" element={<TOS />} />
                                        <Route path="*" element={
                                            (path === "/" || path === "/signup" || path === `/profile/${username}`) ?
                                                <Navigate to="/profile" />
                                                :
                                                <UserNotExist />
                                        } />
                                    </ProtectedRoutes>
                                </CurrentUserProfileProvider>
                                :
                                <Loading error={true} />
                            :
                            <Loading error={false} />

                    :
                    <>
                        {status_code !== 403 ?
                            <Loading error={true} />
                            :
                            <Error404 errorInvoked={true} status_code={403} />
                        }
                    </>
                :
                <Loading error={false} />
            }
        </>
    )
}