import { createContext } from "react";
import { useFetchProfile } from "../hooks/useFetchProfile";
import { useNotificationUpdate } from "../hooks/useNotificationUpdate";
import { CurrentUserProfile } from "../types/context_types.config";
import { socket_conn } from "../functions/SocketConn";

export const CurrentUserProfileContext = createContext<CurrentUserProfile | undefined>(undefined)

interface CurrentUserProfileContextProps {
    auth: boolean,
    username: string,
    connection: typeof socket_conn,
    children: React.ReactNode
}

export const CurrentUserProfileProvider = (props: CurrentUserProfileContextProps) => {
    
    const { auth, username, connection, children } = props
    const { profile_page, setProfile, profile_page_pending, profile_page_error } = useFetchProfile(auth, username)
    // Fetch user's current notification counter.
    const { notification_counter, notification_error, notification_pending } = useNotificationUpdate(username, connection)
    
    return (
        <CurrentUserProfileContext.Provider value={{ 
            profile_page, 
            setProfile, 
            profile_page_pending, 
            profile_page_error,
            notification_counter,
            notification_error,
            notification_pending,
        }}>
            { children }
        </CurrentUserProfileContext.Provider>
    )
}