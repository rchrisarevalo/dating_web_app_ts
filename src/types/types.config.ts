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
    sexual_orientation: string,
    relationship_status: string,
    profile_pic: string
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
    username: string, 
    logged_in_user: string
}