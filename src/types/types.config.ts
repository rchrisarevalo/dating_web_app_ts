export type MatchProfiles = {
    age: number,
    city_residence: string,
    first_name: string,
    interests: string,
    state_residence: string,
    uri: string,
    username: string
}

export type CurrentProfile = {
    username: string,
    name: string,
    age: number,
    height: string,
    interests: string,
    gender: string,
    sexual_orientation: string,
    relationship_status: string,
    birth_date: string,
    birth_month: string,
    birth_year: string,
    profile_pic: string
}

export type CurrentRequestStatus = {
    sent: boolean,
    made: boolean,
    type: string,
    approved: boolean,
    is_requestor: boolean,
}

export type ChatReq = {
    first_name: string,
    username: string,
    request_made: string,
    request_accepted: boolean,
    uri: string
}

export type ConfirmPwd = {
    password: string,
    confirm_password: string
}

export type UserBirthday = {
    age: number,
    birth_month: string,
    birth_date: string,
    birth_year: string
}

export type RatingSubmission = {
    rating_type: string,
    original_rating_type: string, 
    username: string, 
    logged_in_user: string,
    index: number
}