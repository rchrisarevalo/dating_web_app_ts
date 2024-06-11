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
    req_count: number,
    req_pending: boolean,
    req_error: boolean,
    algo_config: boolean,
    use_so_filter: boolean,
    algo_pending: boolean,
    algo_error: boolean,
    setAlgoConfig: React.Dispatch<React.SetStateAction<boolean>>,
    setSOFilterUsed: React.Dispatch<React.SetStateAction<boolean>>
}