// Import hooks from 'react' library and custom hooks.
import { useEffect, useState } from "react";
import { useFetchLogin } from "../hooks/useFetchLogin";
import { useFetchProfile } from "../hooks/useFetchProfile";
import { useFetchProfiles } from "../hooks/useFetchSearch";
import { useFetchAlgoConfig } from "../hooks/useFetchSearch";
import { useNotificationUpdate } from "../hooks/useNotificationUpdate";

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
import { SearchPage } from "../page-components/SearchPage";
import { User } from "../page-components/User";
import { Message } from "../page-components/Message";
import { TOS } from "../page-components/TOS";
import { UserNotExist } from "./UserNotExist";

// Import socket connection.
import { socket_conn } from "../functions/SocketConn";
import { Nav } from "./Nav";

// Interface for protected routes props.
interface RoutesProps {
    children: React.ReactNode
}

export const RoutingSystem = () => {
    const { auth, pending, error, username, profile_pic, status_code } = useFetchLogin()
    const { profile_page, profile_page_pending, profile_page_error } = useFetchProfile(auth)
    const { algo_config, use_so_filter, algo_pending, algo_error } = useFetchAlgoConfig("http://localhost:4000/privacy/check_recommendation_settings", auth)
    const profile_data = useFetchProfiles("http://localhost:4000/get_user_profiles", auth)
    const path = useLocation().pathname
    const domain_path = path.split("/")[1]

    const ProtectedRoutes = (props: RoutesProps) => {
        const { children } = props

        const [connection] = useState(socket_conn)

        // Connect socket connection if user is authenticated.
        useEffect(() => {
            // Connect the authenticated user to the socket if
            // their login has been verified.
            if (!pending && !error && auth) {
                connection.connect()
            } 
            
            // Otherwise, disconnect them from the socket.
            else {
                connection.disconnect()
            }

            // Connect the user to the socket to allow them to send real-time
            // messages to other users.
            connection.on('connect', () => {
                console.log("We are connecting!")
                connection.emit('store-user-socket-id', username, connection.id)
            })

            // Disconnect the user from the socket once they have logged out
            // or if their session.
            connection.on('disconnect', () => {
                console.log("Disconnected!")
                connection.emit('remove-user-socket-id', username)
            })

            // Cleanup function to prevent the socket connection
            // from running more than once.
            return () => {
                connection.off('connect')
            }
        }, [connection])

        // Fetch user's current notification counter.
        const { notification_counter, notification_error, notification_pending } = useNotificationUpdate(username, connection)
        
        // This section is executed when the user navigates another page through
        // their browser's search bar or if they are opening their browser while
        // their session is currently valid.
        sessionStorage.setItem('username', username)
        sessionStorage.setItem('profile_pic', profile_pic)

        return (
            <>
                { (path !== "/tos" && domain_path !== "message" && domain_path !== "user") ?
                    <Nav username={username} notificationCounter={notification_counter} error={notification_error} pending={notification_pending} />
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
                                <ProtectedRoutes>
                                    <Route index path="/profile" element={<Profile 
                                        profile={profile_page}
                                        pending={profile_page_pending}
                                        error={profile_page_error}
                                    />} />
                                    <Route path="/profile/options" element={<Options />} />
                                    <Route path="/profile/options/update" element={<Update username={username} />} />
                                    <Route path="/profile/options/settings" element={<AccountSettings username={username} /> } />
                                    <Route path="/profile/options/privacy" element={<PrivacySettings 
                                        username={username}
                                        auth={auth}
                                    />} />
                                    <Route path="/profile/options/privacy/view_blocked_users" element={<BlockedUsers />} />
                                    <Route path="/profile/options/privacy/download_information" element={<DownloadInfo />} />
                                    <Route path="/profile/recent_messages" element={<RecentMessages />} />
                                    <Route path="/profile/search" element={<SearchPage 
                                        algo_config={algo_config}
                                        use_so_filter={use_so_filter}
                                        algo_pending={algo_pending}
                                        algo_error={algo_error}
                                    />} />
                                    {profile_data.profiles.map((user: { username: string; }) => 
                                        <>
                                            <Route path={`/user/${user.username}`} element={<User username={user.username} />} />
                                            <Route path={`/message/${user.username}`} element={<Message username={username} />} />
                                        </>
                                    )}
                                    <Route path="/tos" element={<TOS />} />
                                    <Route path="*" element={
                                        (path === "/" || path === "/signup" || path === `/profile/${username}`) ?
                                            <Navigate to="/profile" />
                                            :
                                            <UserNotExist />
                                    } />
                                </ProtectedRoutes>
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