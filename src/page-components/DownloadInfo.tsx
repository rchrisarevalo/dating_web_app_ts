import { useState } from 'react'
import { Link } from 'react-router-dom'
import MediaQuery from 'react-responsive'
import Modal from 'react-bootstrap/Modal'

import { IoArrowBackCircleSharp } from 'react-icons/io5'

export const DownloadInfo = () => {
    const [infoSelect, setInfoSelect] = useState({
        profileInfo: false,
        messageHistory: false,
        ratingsMade: false,
        everything: false,
        confirmed_password: ""
    })

    const [downloadMsg, setDownloadMsg] = useState("")
    const [displayModal, setDisplayModal] = useState(false)

    // State variables that will store the initial password and the confirmed password.
    const [password, setPassword] = useState({initial_password: "", confirmed_password: ""})

    const downloadData = () => {
        infoSelect.confirmed_password = password.confirmed_password

        fetch("http://localhost:5000/privacy/download_data", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(infoSelect),
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
            // Display a success message.
            setDownloadMsg("Successfully downloaded data!")
            
            // Link to route that triggers download of JSON file that contains
            // requested information from the current user.
            window.location.href = "http://localhost:5000/user_data_download"
        }).catch((error) => {
            // Display an error message.
            setDownloadMsg("There was a problem downloading your requested information. Please try again.")
            console.log(error)
        }).finally(() => {
            // Clear info, regardless of whether download was successful.
            clearInfoAfterClose()

            setTimeout(() => {
                setDownloadMsg("")
            }, 3000)
        })
    }

    const clearInfoAfterClose = () => {
        setPassword({initial_password: "", confirmed_password: ""})
        setDisplayModal(false)
    }

    return (
        <>
            <MediaQuery minWidth={1025}>
                <div className="download-info-container">
                    <Link to="/profile/options/privacy" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'white', width: '6vh'}}>
                        <IoArrowBackCircleSharp size={50} color='white' style={{marginBottom: '10px', marginTop: '10px', cursor: 'pointer'}}/>
                    </Link>
                    <br></br>
                    <h1>Select one of the following categories of information below to download:</h1>
                    <div className="download-info-row">
                        <div className="download-info-col">
                            <h4>Profile Information</h4>
                            <p>Download your profile information that contains your name, age, sexual orientation, etc.</p>
                            {infoSelect.profileInfo ?
                                <button value="Profile Info" onClick={() => setInfoSelect({ ...infoSelect, profileInfo: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                                :
                                <button value="Profile Info" onClick={() => setInfoSelect({ ...infoSelect, profileInfo: true, everything: false })}>Select</button>
                            }
                        </div>
                        <div className="download-info-col">
                            <h4>Message History</h4>
                            <p>Download your message history with users you have messaged in the past.</p>
                            {infoSelect.messageHistory ?
                                <button value="Message History" onClick={() => setInfoSelect({ ...infoSelect, messageHistory: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                                :
                                <button value="Message History" onClick={() => setInfoSelect({ ...infoSelect, messageHistory: true, everything: false })}>Select</button>
                            }
                        </div>
                        <div className="download-info-col">
                            <h4>Ratings Made</h4>
                            <p>Download your history of the users you have rated in the past after messaging them.</p>
                            {infoSelect.ratingsMade ?
                                <button value="Ratings Made" onClick={() => setInfoSelect({ ...infoSelect, ratingsMade: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                                :
                                <button value="Ratings Made" onClick={() => setInfoSelect({ ...infoSelect, ratingsMade: true, everything: false })}>Select</button>
                            }
                        </div>
                        <div className="download-info-col">
                            <h4>Everything</h4>
                            <p>Download all your information from the previous three information categories.</p>
                            {infoSelect.everything ?
                                <button value="Everything" onClick={() => setInfoSelect({ ...infoSelect, everything: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                                :
                                <button value="Everything" onClick={() => setInfoSelect({ profileInfo: false, messageHistory: false, ratingsMade: false, everything: true, confirmed_password: password.confirmed_password })}>Select</button>
                            }
                        </div>
                    </div>
                    <br></br>
                    <button onClick={() => setDisplayModal(true)} style={{paddingLeft: '30px', paddingRight: '30px'}}>Download</button>
                    {!downloadMsg ? <></> : <><br></br><h6>{`${downloadMsg}`}</h6></>}
                </div>
            </MediaQuery>

            <MediaQuery maxWidth={1025}>
                <div className="download-info-container">
                    <Link to="/profile/options/privacy" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'white', width: '6vh'}}>
                        <IoArrowBackCircleSharp size={50} color='white' style={{marginBottom: '10px', marginTop: '10px', cursor: 'pointer'}}/>
                    </Link>
                    <br></br>
                    <h1>Select one of the following categories of information below to download:</h1>
                    <div className="download-info-col">
                        <h4>Profile Information</h4>
                        <p>Download your profile information that contains your name, age, sexual orientation, etc.</p>
                        {infoSelect.profileInfo ?
                            <button value="Profile Info" onClick={() => setInfoSelect({ ...infoSelect, profileInfo: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                            :
                            <button value="Profile Info" onClick={() => setInfoSelect({ ...infoSelect, profileInfo: true, everything: false })}>Select</button>
                        }
                    </div>
                    <div className="download-info-col">
                        <h4>Message History</h4>
                        <p>Download your message history with users you have messaged in the past.</p>
                        {infoSelect.messageHistory ?
                            <button value="Message History" onClick={() => setInfoSelect({ ...infoSelect, messageHistory: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                            :
                            <button value="Message History" onClick={() => setInfoSelect({ ...infoSelect, messageHistory: true, everything: false })}>Select</button>
                        }
                    </div>
                    <div className="download-info-col">
                        <h4>Ratings Made</h4>
                        <p>Download your history of the users you have rated in the past after messaging them.</p>
                        {infoSelect.ratingsMade ?
                            <button value="Ratings Made" onClick={() => setInfoSelect({ ...infoSelect, ratingsMade: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                            :
                            <button value="Ratings Made" onClick={() => setInfoSelect({ ...infoSelect, ratingsMade: true, everything: false })}>Select</button>
                        }
                    </div>
                    <div className="download-info-col">
                        <h4>Everything</h4>
                        <p>Download all your information from the previous three information categories.</p>
                        {infoSelect.everything ?
                            <button value="Everything" onClick={() => setInfoSelect({ ...infoSelect, everything: false })} style={{ background: 'green', color: 'white' }}>Select</button>
                            :
                            <button value="Everything" onClick={() => setInfoSelect({ profileInfo: false, messageHistory: false, ratingsMade: false, everything: true, confirmed_password: password.confirmed_password })}>Select</button>
                        }
                    </div>
                    <br></br>
                    <button onClick={() => setDisplayModal(true)} style={{paddingLeft: '30px', paddingRight: '30px'}}>Download</button>
                    <br></br>
                    {!downloadMsg ? <></> : <><br></br><h6>{`${downloadMsg}`}</h6></>}
                </div>
            </MediaQuery>

            <Modal show={displayModal} onHide={() => clearInfoAfterClose()} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title><b>Download Your Information</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>Before downloading your data, it is crucial that we verify your identity to better protect your privacy and security and prevent unauthorized access to your personal data.</Modal.Body>
                <Modal.Body>By <b>entering and confirming your password</b> below, you agree to the terms of the <a href="/privacy" rel="noreferrer"><b>Privacy Policy</b></a> with respect to the information you are about to receive in a file.</Modal.Body>
                <Modal.Body>Please note that you can only download your information once every <b>30 days</b> for security reasons.</Modal.Body>
                <Modal.Body>
                    <input type="password" placeholder="Enter your password" style={{fontSize: '18px', border: '1px solid black', width: '75%', marginBottom: '2vh', transition: '.5s'}} onChange={(e) => setPassword({...password, initial_password: e.target.value})} id="initial-password"></input>
                    <input type="password" placeholder="Enter your password again" style={{fontSize: '18px', border: '1px solid black', width: '75%', marginBottom: '2vh', transition: '.5s'}} onChange={(e) => setPassword({...password, confirmed_password: e.target.value})} id="confirmed-password"></input>
                    {(password.initial_password.length > 0 && password.confirmed_password.length > 0) ?
                        <>
                            { password.initial_password === password.confirmed_password ?
                                <p style={{color: 'green'}}><b>Passwords are the same!</b></p> 
                                : 
                                <p style={{color: 'red'}}><b>Passwords are not the same.</b></p>
                            }
                        </>
                        :
                        <></>
                    }
                </Modal.Body>
                <Modal.Footer>
                    { (password.confirmed_password.length > 0) && (password.initial_password === password.confirmed_password) ? 
                        <button style={{padding: '7px 30px', borderRadius: '20px', border: 'none', background: 'black', color: 'white', fontWeight: '1000', transition: '.5s'}} onClick={() => downloadData()}>Submit Request</button> 
                        : 
                        <button style={{padding: '7px 30px', borderRadius: '20px', border: 'none', background: 'rgba(0, 0, 0, 0.26)', color: 'white', fontWeight: '1000', transition: '.5s'}} disabled>Submit Request</button>
                    }
                </Modal.Footer>
            </Modal>
        </>
    )
}