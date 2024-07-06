import { createContext } from "react";

import { useFetchProfile } from "../hooks/useFetchProfile";
import { useNotificationUpdate } from "../hooks/useNotificationUpdate";
import { useFetchReqCount } from "../hooks/useChatReq";
import { useFetchAlgoConfig } from "../hooks/useFetchSearch";

import { CurrentProfile } from "../types/context_types.config";
import { socket_conn } from "../functions/SocketConn";

export const CurrentUserProfileContext = createContext<CurrentProfile | undefined>(undefined)

interface CurrentUserProfileContextProps {
    auth: boolean,
    username: string,
    connection: typeof socket_conn,
    children: React.ReactNode
}

export const CurrentUserProfileProvider = (props: CurrentUserProfileContextProps) => {
    // Get the properties fed to the component by the RouteSystem component.
    const { auth, username, connection, children } = props

    // Get current user profile attributes.
    const { profile_page, setProfile, profile_page_pending, profile_page_error } = useFetchProfile(auth, username)
    
    // Fetch user's current notification counter.
    const { notification_counter, notification_error, notification_pending } = useNotificationUpdate(username, connection)
    
    // Fetch user's current request count based on the requests sent to them
    // excluding the ones they made to others.
    const { req_count, req_pending, req_error } = useFetchReqCount("http://localhost:4000/retrieve_request_count", connection)
    
    // Fetch current user's configuration settings.
    const { algo_config, use_so_filter, algo_pending, algo_error, setAlgoConfig, setSOFilterUsed } = useFetchAlgoConfig("http://localhost:4000/privacy/check_recommendation_settings", auth)

    // Store the user attributes in an object.
    const current_user_attr = { 
        profile_page,
        setProfile,
        profile_page_pending,
        profile_page_error,
        notification_counter,
        notification_error,
        notification_pending,
        req_count,
        req_pending,
        req_error,
        algo_config,
        use_so_filter,
        algo_pending,
        algo_error,
        setAlgoConfig,
        setSOFilterUsed
    }

    // Return the context provider to be used for the protected routes.
    return (
        <CurrentUserProfileContext.Provider value={current_user_attr}>
            { children }
        </CurrentUserProfileContext.Provider>
    )
}