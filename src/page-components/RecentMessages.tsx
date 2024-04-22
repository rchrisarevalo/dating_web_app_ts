import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    IoHeartOutline, IoHeart, IoHeartDislikeOutline,
    IoHeartDislike,
    IoHeartHalfOutline
} from "react-icons/io5"
import { Loading } from '../components/Loading'

import { RatingSubmission } from '../types/types.config'
import MediaQuery from 'react-responsive'
import { Spinner } from 'react-bootstrap'

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

    const [ratingChangeStatus, setRatingChangeStatus] = useState({
        error: false,
        submitted: false
    })

    useEffect(() => {
        fetch('http://localhost:4000/check_messaged_users', {
            method: 'GET',
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
            setError(false)
        }).catch((error) => {
            console.log(error)
            setPending(false)
            setError(true)
        })
    }, [])

    const handleRatingSubmission = (user_rating_details: RatingSubmission) => {

        setRecentMessagedUsers((prev) => {
            const updatedRecentMessages = [...prev]
            updatedRecentMessages[user_rating_details.index]["rating_type"] = user_rating_details.rating_type
            return updatedRecentMessages
        })

        fetch(`http://localhost:5000/rating?rt=${user_rating_details.rating_type}&user=${user_rating_details.username}`, {
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
        }).then(() => {
            setRatingChangeStatus({ ...ratingChangeStatus, error: false })
        }).catch((error) => {
            setRatingChangeStatus({ ...ratingChangeStatus, error: true })

            setRecentMessagedUsers((prev) => {
                const originalRecentMessages = [...prev]
                originalRecentMessages[user_rating_details.index]["rating_type"] = user_rating_details.original_rating_type
                return originalRecentMessages
            })

            console.log(error)
        }).finally(() => {
            setTimeout(() => {
                setRatingChangeStatus({ ...ratingChangeStatus, submitted: false, error: false })
            }, 1000)
        })
    }

    return (
        <div className="recent-messages-container">
            <h1>Recent Messages</h1>
            <br></br>
            {!pending ?
                <>
                    {!error ?
                        recentMessagedUsers.length !== 0 ?
                            recentMessagedUsers.map((recent, i) =>
                                <div className="recent-messaged-users">
                                    <MediaQuery minWidth={1025}>
                                        <div className="recent-user-col">
                                            <div className="recent-user-sect">
                                                <Link to={`/message/${recent.user2}`}>
                                                    <div className="recent-user-row">
                                                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                                                            <img alt="profile_pic" src={`data:image/png;base64,${recent.uri}`} style={{ pointerEvents: 'none' }} />
                                                            <h4 style={{ marginLeft: '20px', marginRight: '20px' }}>{recent.first_name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="recent-user-row">
                                                        <p>{recent.message}</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="recent-user-sect">
                                                <div className="user-feedback-row">
                                                    {!ratingChangeStatus.submitted ?
                                                        !ratingChangeStatus.error ?
                                                            <>
                                                                <div className="user-feedback-column">
                                                                    <>
                                                                        {recent.rating_type === "positive" ?
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "positive", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="positive">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeart size={30} color='red' />
                                                                                </div>
                                                                            </button>
                                                                            :
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "positive", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="positive">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartOutline size={30} />
                                                                                </div>
                                                                            </button>
                                                                        }
                                                                    </>
                                                                </div>
                                                                <div className="user-feedback-column">
                                                                    {recent.rating_type === "neutral" ?
                                                                        <button onClick={() => handleRatingSubmission({ rating_type: "neutral", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="neutral">
                                                                            <div className="user-feedback-column">
                                                                                <IoHeartHalfOutline size={30} color='yellow' />
                                                                            </div>
                                                                        </button>
                                                                        :
                                                                        <button onClick={() => handleRatingSubmission({ rating_type: "neutral", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="neutral">
                                                                            <div className="user-feedback-column">
                                                                                <IoHeartHalfOutline size={30} />
                                                                            </div>
                                                                        </button>
                                                                    }
                                                                </div>
                                                                <div className="user-feedback-column">
                                                                    {recent.rating_type === "negative" ?
                                                                        <div className="user-feedback-column">
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "negative", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="negative">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartDislike size={30} color='blue' />
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                        :
                                                                        <div className="user-feedback-column">
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "negative", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="negative">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartDislikeOutline size={30} />
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            </>
                                                            :
                                                            <h3>Error submitting rating.</h3>
                                                        :
                                                        <Spinner />
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </MediaQuery>
                                    <MediaQuery maxWidth={1025}>
                                        <div className="recent-user-row">
                                            <div className="recent-user-sect">
                                                <Link to={`/message/${recent.user2}`}>
                                                    <div className="recent-user-row">
                                                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                                                            <img alt="profile_pic" src={`data:image/png;base64,${recent.uri}`} />
                                                            <h4 style={{ marginLeft: '20px', marginRight: '20px' }}>{recent.first_name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="recent-user-row">
                                                        <p>{recent.message}</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="recent-user-sect">
                                                <div className="user-feedback-row">
                                                    {!ratingChangeStatus.submitted ?
                                                        !ratingChangeStatus.error ?
                                                            <>
                                                                <div className="user-feedback-column">
                                                                    <>
                                                                        {recent.rating_type === "positive" ?
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "positive", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="positive">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeart size={30} color='red' />
                                                                                </div>
                                                                            </button>
                                                                            :
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "positive", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="positive">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartOutline size={30} />
                                                                                </div>
                                                                            </button>
                                                                        }
                                                                    </>
                                                                </div>
                                                                <div className="user-feedback-column">
                                                                    {recent.rating_type === "neutral" ?
                                                                        <button onClick={() => handleRatingSubmission({ rating_type: "neutral", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="neutral">
                                                                            <div className="user-feedback-column">
                                                                                <IoHeartHalfOutline size={30} color='yellow' />
                                                                            </div>
                                                                        </button>
                                                                        :
                                                                        <button onClick={() => handleRatingSubmission({ rating_type: "neutral", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="neutral">
                                                                            <div className="user-feedback-column">
                                                                                <IoHeartHalfOutline size={30} />
                                                                            </div>
                                                                        </button>
                                                                    }
                                                                </div>
                                                                <div className="user-feedback-column">
                                                                    {recent.rating_type === "negative" ?
                                                                        <div className="user-feedback-column">
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "negative", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="negative">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartDislike size={30} color='blue' />
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                        :
                                                                        <div className="user-feedback-column">
                                                                            <button onClick={() => handleRatingSubmission({ rating_type: "negative", original_rating_type: recent.rating_type, username: recent.user2, logged_in_user: retrieveUsername, index: i })} id="negative">
                                                                                <div className="user-feedback-column">
                                                                                    <IoHeartDislikeOutline size={30} />
                                                                                </div>
                                                                            </button>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            </>
                                                            :
                                                            <h3>Error submitting rating.</h3>
                                                        :
                                                        <Spinner />
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <br></br>
                                    </MediaQuery>
                                </div>
                            )
                            :
                            <b id="recent-messages-empty">You haven't messaged anyone recently!</b>
                        :
                        <Loading error={true} />
                    }
                </>
                :
                <h5 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', height: '70vh', color: 'white' }}>Loading messages...</h5>
            }
        </div>
    )
}