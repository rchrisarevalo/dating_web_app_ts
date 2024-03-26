import { useState, useEffect } from 'react'
import { CalculateBirthday } from '../functions/CalculateBirthday'
import { Loading } from '../components/Loading'

export const Profile = () => {
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

    // State variable that is used if error is detected.
    const [error, setError] = useState(false)

    // State variable that handles pending status.
    const [pending, setPending] = useState(true)

    // useEffect hook will use the user's username to retrieve basic
    // profile information, such as their name, bio, age, etc.
    useEffect(() => {
        const retrieveProfile = async () => {
            await fetch("http://localhost:5000/profile", {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({}),
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
                    name: `${data.first_name} ${data.middle_name} ${data.last_name}`,
                    age: CalculateBirthday(data.birth_month, parseInt(data.birth_date), parseInt(data.birth_year)),
                    height: data.height,
                    interests: data.interests,
                    sexual_orientation: data.sexual_orientation,
                    relationship_status: data.relationship_status,
                    profile_pic: data.uri
                })
                sessionStorage.setItem("profile_pic", data.uri)
                setPending(false)
            }).catch((error) => {
                console.log(error)
                setPending(false)
                setError(true)
            })
        }
        retrieveProfile()
    }, [])

    return (
        <div className="profile-container">
            {!pending ?
                <>
                    {!error ? 
                        <div className="profile-page-section">
                            <div className="profile-page-pic">
                                <img src={`data:image/png;base64,${profile.profile_pic}`} alt="profile-pic"></img>
                            </div>
                            <div className="profile-page-bio">
                                <h1>{`${profile.name}, ${profile.age}`}</h1>
                                <p>
                                    {/* Split the interests section into paragraphs if the user has entered it that way. */}
                                    {profile.interests.split("\n").map((paragraph, i) => 
                                        <p key={`profile-interests-paragraph-${i}`}>
                                            {paragraph}
                                            <br></br>
                                        </p>
                                    )}
                                </p>
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
                        <Loading error={error}/>
                    }
                </>
                :
                <Loading error={false} />
            }
        </div>
    )
}