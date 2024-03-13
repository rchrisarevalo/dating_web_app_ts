import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IoHeartOutline, IoHeart, IoHeartDislikeOutline,
         IoHeartDislike,
         IoHeartHalfOutline } from "react-icons/io5"
import { Loading } from '../components/Loading'

export const RecentMessages = () => {

    const [retrieveUsername, setRetrieveUsername] = useState("")
    const [recentMessagedUsers, setRecentMessagedUsers] = useState([{
        user2: "",
        uri: "",
        first_name: "",
        sent_time: "",
        message: "",
        rating_type: "",
    }])

    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)

    useEffect(() => {
        fetch('http://localhost:5000/check_messaged_users', {
            method: 'POST',
            credentials: 'include',
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
            setRecentMessagedUsers(data)
            setRetrieveUsername(data.username)
            setPending(false)
        }).catch((error) => {
            console.log(error)
            setPending(false)
            setError(true)
        })
    }, [])

    const handleRating = (rating_type: string, username: string) => {
        fetch(`http://localhost:5000/rating?rt=${rating_type}&user=${username}`, {
            method: 'POST',
            credentials: 'include',
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
            setRecentMessagedUsers(data)
        }).catch((error) => {
            console.log(error)
        })
    }

    useEffect(() => {
        console.log(pending, error)
    }, [pending, error])

    const handleRatingSubmission = (user_rating_details: Record<string, string>) => {
        handleRating(user_rating_details.rating_type, user_rating_details.username)
    }

    return (
        <div className="recent-messages-container">
            <h1>Recent Messages</h1>
            <br></br>
            { !pending ?
                <>
                    { !error ? 
                        recentMessagedUsers.length !== 0 ? 
                            recentMessagedUsers.map(recent =>
                                <div className="recent-messaged-users">
                                    <Link to={`/message/${recent.user2}`}>
                                        <div className="recent-user-row">
                                            <img alt="profile_pic" src={`data:image/png;base64,${recent.uri}`}></img>
                                            <h4>{`${recent.first_name}`}</h4>
                                            <p>{`${recent.sent_time}`}</p>
                                        </div>
                                        <div className="recent-user-row">
                                            <p>{`${recent.message}`}</p>
                                            <div className="user-feedback-row">
                                                {recent.rating_type === null &&
                                                    <>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "positive", username: recent.user2, logged_in_user: retrieveUsername})} id="positive">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "neutral", username: recent.user2, logged_in_user: retrieveUsername})} id="neutral">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartHalfOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "negative", username: recent.user2, logged_in_user: retrieveUsername})} id="negative">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartDislikeOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    </>
                                                }
                                                {recent.rating_type === "positive" &&
                                                    <>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "positive", username: recent.user2, logged_in_user: retrieveUsername})} id="positive">
                                                                <div className="user-feedback-column">
                                                                    <IoHeart size={30} color='red'/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "neutral", username: recent.user2, logged_in_user: retrieveUsername})} id="neutral">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartHalfOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "negative", username: recent.user2, logged_in_user: retrieveUsername})} id="negative">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartDislikeOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    </>
                                                }
                                                {recent.rating_type === "neutral" &&
                                                    <>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "positive", username: recent.user2, logged_in_user: retrieveUsername})} id="positive">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "neutral", username: recent.user2, logged_in_user: retrieveUsername})} id="neutral">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartHalfOutline size={30} color='yellow'/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "negative", username: recent.user2, logged_in_user: retrieveUsername})} id="negative">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartDislikeOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    </>
                                                }
                                                {recent.rating_type === "negative" &&
                                                    <>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "positive", username: recent.user2, logged_in_user: retrieveUsername})} id="positive">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "neutral", username: recent.user2, logged_in_user: retrieveUsername})} id="neutral">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartHalfOutline size={30}/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="user-feedback-column">
                                                            <Link to="/profile/recent_messages" onClick={() => handleRatingSubmission({rating_type: "negative", username: recent.user2, logged_in_user: retrieveUsername})} id="negative">
                                                                <div className="user-feedback-column">
                                                                    <IoHeartDislike size={30} color='blue'/>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )
                            : 
                            <b id="recent-messages-empty">You haven't messaged anyone recently!</b>
                        :
                        <Loading error={error} />
                    }
                </>
                :
                <h5 style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', height: '70vh', color: 'white'}}>Loading messages...</h5>
            }
        </div>
    )
}