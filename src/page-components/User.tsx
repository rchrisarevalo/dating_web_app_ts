import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CalculateBirthday } from '../functions/CalculateBirthday'
import { UserNav } from '../components/Nav'
import { Loading } from '../components/Loading'
import { MobileFooter } from '../components/MobileFooter'

import { useLogVisit } from '../hooks/useLogVisit'

interface UserProps {
    username: string
}

export const User = (props: UserProps) => {
    // Store logged in user's username to use when checking to see if this user was blocked
    // by them.
    const { username } = props

    const [profile, setProfile] = useState({
        username: "",
        name: "",
        age: 0,
        height: "",
        interests: "",
        sexual_orientation: "",
        relationship_status: "",
        profile_pic: ""
    })

    // State variable that stores user's block status (i.e., false = user not blocked, true = user is blocked).
    const [blocked, setBlocked] = useState(false)

    const currentRoute = useLocation()
    const retrieve_username_from_path = currentRoute.pathname.split("/user/")[1]

    // State variable that is used if error is detected.
    const [error, setError] = useState(false)

    // State variable that handles pending status.
    const [pending, setPending] = useState(true)

    // useEffect hook will use the user's username to retrieve basic
    // profile information, such as their name, bio, age, etc.
    useEffect(() => {
        const retrieveUserProfile = async () => {
            await fetch(`http://localhost:4000/profile/${retrieve_username_from_path}`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    username: retrieve_username_from_path
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
                setProfile({
                    username: data.username,
                    name: `${data.first_name}`,
                    age: CalculateBirthday(data.birth_month, parseInt(data.birth_date), parseInt(data.birth_year)),
                    height: data.height,
                    interests: data.interests,
                    sexual_orientation: data.sexual_orientation,
                    relationship_status: data.relationship_status,
                    profile_pic: data.uri
                })
                setPending(false)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
        retrieveUserProfile()
    }, [retrieve_username_from_path])

    useLogVisit(retrieve_username_from_path)

    // Retrieve user's blocked status.
    useEffect(() => {
        fetch("http://localhost:4000/retrieve_block_status", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                logged_in_user: username,
                profile_user: retrieve_username_from_path
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
            if (data.length !== 0) {
                setBlocked(true)
            } else {
                // Do nothing...
            }
        }).catch((error) => {
            console.log(error)
            setError(true)
        })
    }, [username, retrieve_username_from_path])

    return (
        <div className="profile-container">
            <UserNav current_user_username={retrieve_username_from_path} logged_in_user_username={username} blocked={blocked} />
            {!pending ?
                <>
                    {!error ?
                        <div className="profile-page-section">
                            <div className="profile-page-pic">
                                <img src={`data:image/png;base64,${profile.profile_pic}`} alt="profile-pic"></img>
                            </div>
                            <div className="profile-page-bio">
                                <h1>{`${profile.name}, ${profile.age}`}</h1>
                                {profile.interests.split("\n").map((paragraph, i) => 
                                    <p key={`profile-interests-paragraph-${i}`}>
                                        {paragraph}
                                        <br></br>
                                    </p>
                                )}
                            </div>
                            <div className="profile-page-details">
                                <div className="profile-page-details-row">
                                    <div className="profile-page-details-col">
                                        <h4>Height</h4>
                                        <h5>{`${profile.height}`}</h5>
                                        <h4>Sexual Orientation</h4>
                                        <h5>{`${profile.sexual_orientation}`}</h5>
                                    </div>
                                    <div className="profile-page-details-col">
                                        <h4>Relationship Status</h4>
                                        <h5>{`${profile.relationship_status}`}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        <Loading error={error} />
                    }
                </>
                :
                <Loading error={error} />
            }
            <MobileFooter username={username} blocked={blocked} />
        </div>
    )
}