import React from "react"
import { CurrentProfile } from "./types.config"

export type CurrentUserProfile = {
    profile_page: CurrentProfile,
    setProfile: React.Dispatch<React.SetStateAction<CurrentProfile>>,
    profile_page_pending: boolean,
    profile_page_error: boolean,
    notification_counter: number,
    notification_error: boolean,
    notification_pending: boolean,
}