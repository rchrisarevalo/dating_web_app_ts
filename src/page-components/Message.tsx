import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IoSendSharp, IoArrowBackOutline } from 'react-icons/io5'
import MediaQuery from 'react-responsive'

import { socket_conn } from '../functions/SocketConn'
import { Loading } from '../components/Loading'
import { useFetchUserTyping } from '../hooks/useFetchUserTyping'

import { Spinner } from 'react-bootstrap'
import { useFetchMessages } from '../hooks/useFetchMessages'

interface MessageProps {
    username: string
}

export const Message = (props: MessageProps) => {
    const currentRoute = useLocation()
    const [currentMsg, setCurrentMsg] = useState("")
    const [displayCharLimit, setDisplayCharLimit] = useState(false)
    const [submit, setSubmit] = useState(false)
    const [charLimit, setCharLimit] = useState(0)
    const [connection] = useState(socket_conn)
    const [messageLog, setMessageLog] = useState([{
        message_from: "",
        message: ""
    }])

    const retrieve_receive_user_from_path = currentRoute.pathname.split("/message/")[1]

    const { sender_is_typing } = useFetchUserTyping(retrieve_receive_user_from_path, currentMsg, connection)
    const { messages, receiver_profile_pic, receiver_name, pending, error } = useFetchMessages(retrieve_receive_user_from_path, submit)

    const { username } = props

    // Scroll to bottom of page after messages have loaded.
    useEffect(() => {
        if (!pending && !error) {
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight)
            }, 1000)
        }
    }, [error, pending])

    // Scroll to bottom of page if message is submitted.
    useEffect(() => {
        if (submit) {
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight)
            }, 1000)
        }
    }, [submit])

    // Update list of messages for recipient.
    useEffect(() => {
        if (connection.active) {
            // After the server emits the updated list, then
            // update it on the recipient's end.
            connection.on('recipient-message', () => {
                setSubmit(true)

                // If the recipient happens to be in the same browser
                // as the sender, then clear the former's notification
                // counter.
                if (currentRoute.pathname === `/message/${retrieve_receive_user_from_path}`) {
                    fetch(`http://localhost:5000/clear_notification_count?username=${username}`, {
                        method: 'PUT',
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
                        console.log(data)
                    }).catch((error) => {
                        console.log(error)
                    }).finally(() => {
                        setTimeout(() => {
                            setSubmit(false)
                            window.scrollTo(0, document.body.scrollHeight)
                        }, 1000)
                    })
                }
            })
        } else {
            console.error("Could not receive message", 502)
        }

        // Include cleanup function to allow for the function to run 
        // only once and properly without wasting many resources.
        return () => {
            connection.off('recipient-message')
        }
    }, [currentRoute.pathname,
        username,
        connection,
        retrieve_receive_user_from_path])

    // Store messages in list.
    useEffect(() => {
        if (!error && !pending) {
            setMessageLog(messages)
        }
    }, [messages, error, pending])    

    //                    MESSAGE HANDLING SECTION                    //
    // =============================================================  //
    const handleSubmitMessage = () => {
        // Retrieves text from input box.
        const input_msg = (document.getElementById("message-input") as HTMLInputElement).value

        // Store the logged in user's and recipient user's usernames,
        // along with the message typed in by the former, in an
        // object/dictionary to send to the server.
        const information: Record<string, string> = {
            recipient_user: retrieve_receive_user_from_path,
            message: input_msg
        }

        fetch("http://localhost:5000/post_message", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(information),
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
            // Remove character counter from view.
            setDisplayCharLimit(false)

            // Tell the hook that the message has been sent.
            setSubmit(true)

            // Update messaged user's notification counter.
            connection.emit('update-notification-counter', retrieve_receive_user_from_path)

            // Send updated message list to server so that client can receive it.
            connection.emit('sender-message', messageLog, retrieve_receive_user_from_path)

            // Clear the message after the user has submitted it.
            setCurrentMsg("")

        }).catch((error) => {
            console.log(error)
        }).finally(() => {
            setTimeout(() => {
                // Scroll to the bottom after logged in user
                // sends message.
                window.scrollTo(0, document.body.scrollHeight)
                setSubmit(false)
            }, 1000)
        })
    }

    // Handles the number of characters the user has used up when
    // typing their message.
    const handleCharLimit = () => {
        const input_msg = (document.getElementById("message-input") as HTMLInputElement).value

        setCurrentMsg(input_msg)

        // If user has typed at least one character, then
        // display the message showing how many characters
        // they have used up.
        if (input_msg.length > 0) {
            setDisplayCharLimit(true)
            setCharLimit(input_msg.length)
        }
        // Otherwise, remove the message.
        else {
            setDisplayCharLimit(false)
        }
    }
    // ============================================================== //

    return (
        <>
            <MediaQuery minWidth={1025}>
                <div className="message-container">
                    <>
                        <div className="chat-header">
                            <Link to="/profile/recent_messages" id="search-link"><IoArrowBackOutline size={30} /></Link>
                            <Link to={`/user/${retrieve_receive_user_from_path}`}>
                                <div id="message-username">
                                    {!pending ?
                                        !error ?
                                            <>
                                                <img src={`data:image/png;base64,${receiver_profile_pic}`} alt="receiver-pic" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '20px', pointerEvents: 'none' }}></img>
                                                <b>{`${receiver_name}`}</b>
                                            </>
                                            :
                                            <h6>Error loading. Please try again.</h6>
                                        :
                                        <Spinner />
                                    }
                                </div>
                            </Link>
                        </div>
                        <div className="chat-container">
                            <div className="chats">
                                {!pending ?
                                    <>
                                        {!error ?
                                            <>
                                                {(messageLog.length !== 0) ?
                                                    <>
                                                        {messageLog.map(msg =>
                                                            <div className="chat-message">
                                                                {msg.message_from === username &&
                                                                    <div className="chat-box">
                                                                        <p id="sender-username">{`${username}`}</p>
                                                                        <div className="sender-text">
                                                                            <p>{msg.message}</p>
                                                                        </div>
                                                                    </div>
                                                                }
                                                                {msg.message_from === retrieve_receive_user_from_path &&
                                                                    <div className="chat-box">
                                                                        <p id="recipient-username">{`${retrieve_receive_user_from_path}`}</p>
                                                                        <div className="recipient-text">
                                                                            <p>{msg.message}</p>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            </div>
                                                        )}
                                                        {sender_is_typing &&
                                                            <div className="chat-message" style={{ position: 'relative' }}>
                                                                <div className="chat-box">
                                                                    <p id="recipient-username">{`${retrieve_receive_user_from_path}`}</p>
                                                                    <div className="recipient-text" style={{ background: 'grey', width: '15%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <p>
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.3s', marginRight: '4px' }} />
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.5s', marginLeft: '4px', marginRight: '4px' }} />
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.7s', marginLeft: '4px' }} />
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    </>
                                                    :
                                                    <div style={{ height: '75vh', textAlign: 'center', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                                                        <h1><b>Start a conversation with {`${receiver_name}`}!</b></h1>
                                                        <p style={{ fontWeight: 300, marginLeft: '25%', marginRight: '25%' }}>
                                                            When conversing with a user, please treat them the same way you want to be treated.
                                                            Any form of abuse, whether it'd be verbal, physical, or emotional, will NOT be tolerated.
                                                        </p>
                                                    </div>
                                                }
                                            </>
                                            :
                                            <Loading error={true} />
                                        }
                                    </>
                                    :
                                    <Loading error={false} />
                                }
                            </div>
                        </div>
                        <footer className="message-footer">
                            <div className="message-form">
                                <form className="message-box" onSubmit={(e) => {e.preventDefault(); handleSubmitMessage()}}>
                                    <div id="message-input-box">
                                        <input placeholder="Type in your message..." size={80} id="message-input" autoComplete='off' onChange={handleCharLimit} value={currentMsg} required />
                                        <br></br>
                                        <button onSubmit={() => handleSubmitMessage} id="message-submit"><IoSendSharp /></button>
                                    </div>
                                    {displayCharLimit === true && <span id="char-msg-limit">{`${charLimit}/200`}</span>}
                                </form>
                            </div>
                        </footer>
                    </>
                </div>
            </MediaQuery>
            <MediaQuery maxWidth={1025}>
                <div className="message-container">
                    <>
                        <div className="chat-header">
                            <Link to="/profile/recent_messages" id="search-link"><IoArrowBackOutline size={30} /></Link>
                            <Link to={`/user/${retrieve_receive_user_from_path}`}>
                                <div id="message-username">
                                    {!pending ?
                                        !error ?
                                            <>
                                                <img src={`data:image/png;base64,${receiver_profile_pic}`} alt="receiver-pic" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '20px', pointerEvents: 'none' }}></img>
                                                <b>{`${receiver_name}`}</b>
                                            </>
                                            :
                                            <h6>Error loading. Please try again.</h6>
                                        :
                                        <Spinner />
                                    }
                                </div>
                            </Link>
                        </div>
                        <div className="chat-container">
                            <div className="chats">
                                {!pending ?
                                    <>
                                        {!error ?
                                            <>
                                                {(!pending && messageLog.length !== 0) ?
                                                    <>
                                                        {messageLog.map(msg =>
                                                            <div className="chat-message">
                                                                {msg.message_from === username &&
                                                                    <div className="chat-box">
                                                                        <p id="sender-username">{`${username}`}</p>
                                                                        <div className="sender-text">
                                                                            <p>{msg.message}</p>
                                                                        </div>
                                                                    </div>
                                                                }
                                                                {msg.message_from === retrieve_receive_user_from_path &&
                                                                    <div className="chat-box">
                                                                        <p id="recipient-username">{`${retrieve_receive_user_from_path}`}</p>
                                                                        <div className="recipient-text">
                                                                            <p>{msg.message}</p>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            </div>
                                                        )}
                                                        {sender_is_typing &&
                                                            <div className="chat-message" style={{ position: 'relative' }}>
                                                                <div className="chat-box">
                                                                    <p id="recipient-username">{`${retrieve_receive_user_from_path}`}</p>
                                                                    <div className="recipient-text" style={{ background: 'grey', width: '35%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <p>
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.2s', marginRight: '4px' }} />
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.4s', marginLeft: '4px', marginRight: '4px' }} />
                                                                            <Spinner animation="grow" size={"sm"} style={{ animationDelay: '0.6s', marginLeft: '4px' }} />
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    </>
                                                    :
                                                    <div style={{ height: '75vh', textAlign: 'center', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                                                        <h1><b>Start a conversation with {`${receiver_name}`}!</b></h1>
                                                        <p style={{ fontWeight: 300, marginLeft: '5%', marginRight: '5%' }}>
                                                            When conversing with a user, please treat them the same way you want to be treated.
                                                            Any form of abuse, whether it'd be verbal, physical, or emotional, will NOT be tolerated.
                                                        </p>
                                                    </div>
                                                }
                                            </>
                                            :
                                            <Loading error={true} />
                                        }
                                    </>
                                    :
                                    <Loading error={false} />
                                }
                            </div>
                        </div>
                        <footer className="message-footer">
                            <div className="message-form">
                                <form className="message-box" onSubmit={(e) => {e.preventDefault(); handleSubmitMessage()}}>
                                    <div id="message-input-box">
                                        <input placeholder="Type in your message..." size={25} id="message-input" autoComplete='off' onChange={handleCharLimit} value={currentMsg} maxLength={200} required />
                                        <button onClick={() => handleSubmitMessage} id="message-submit"><IoSendSharp /></button>
                                    </div>
                                    {displayCharLimit === true && <span id="char-msg-limit">{`${charLimit}/200`}</span>}
                                </form>
                            </div>
                        </footer>
                    </>
                </div>
            </MediaQuery>
        </>
    )
}