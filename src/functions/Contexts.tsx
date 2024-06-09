import { createContext } from "react";
import { useFetchProfile } from "../hooks/useFetchProfile";
import { CurrentUserProfile } from "../types/context_types.config";

export const CurrentUserProfileContext = createContext<CurrentUserProfile | undefined>(undefined)

interface CurrentUserProfileContextProps {
    auth: boolean,
    username: string,
    children: React.ReactNode
}

export const CurrentUserProfileProvider = (props: CurrentUserProfileContextProps) => {
    
    const { auth, username, children } = props
    const { profile_page, setProfile, profile_page_pending, profile_page_error } = useFetchProfile(auth, username)
    
    return (
        <CurrentUserProfileContext.Provider value={{ 
            profile_page, 
            setProfile, 
            profile_page_pending, 
            profile_page_error 
        }}>
            { children }
        </CurrentUserProfileContext.Provider>
    )
}