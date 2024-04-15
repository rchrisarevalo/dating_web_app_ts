import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'

import { IoArrowBackCircleSharp } from 'react-icons/io5'
import { Spinner } from 'react-bootstrap'

export const BlockedUsers = () => {
    const [blockedUsers, setBlockedUsers] = useState([])
    const [displayModal, setDisplayModal] = useState(false)
    const [displayReportModal, setDisplayReportModal] = useState(false)
    const [unblockTargetUser, setUnblockTargetUser] = useState("")

    const [inputCharLength, setInputCharLength] = useState(0)

    const [error, setError] = useState(false)
    const [pending, setPending] = useState(true)

    const handleOpenModal = () => setDisplayModal(true)
    const handleCloseModal = () => setDisplayModal(false)

    const handleOpenReportModal = () => setDisplayReportModal(true)
    const handleCloseReportModal = () => setDisplayReportModal(false)

    useEffect(() => {
        fetch("http://localhost:5000/retrieve_blocked_users", {
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
            setPending(false)
            setBlockedUsers(data)
        }).catch((error) => {
            console.log(error)
            setPending(false)
            setError(true)
        })
    }, [])

    const showNotice = (i: number) => {
        const button_val = (document.getElementById(`btn${i}`) as HTMLInputElement).value
        setUnblockTargetUser(button_val)
        handleOpenModal()
    }

    const showReportNotice = (i: number) => {
        const button_val = (document.getElementById(`report-btn${i}`) as HTMLInputElement).value
        setUnblockTargetUser(button_val)
        handleOpenReportModal()
    }

    const handleUnblock = () => {
        fetch("http://localhost:5000/block", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                profile_user: unblockTargetUser,
                block_requested: true
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
            console.log(data)
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        }).catch((error) => {
            console.log(error)
            setError(true)
        })
    }

    const handleDescriptionCharLimit = () => {
        const description = (document.getElementById("reason-description") as HTMLInputElement).value
        setInputCharLength(description.length)
    }

    return (
        <div className="blocked-users-container">
            <div className="blocked-users-menu">
            <Link to="/profile/options/privacy" style={{width: '6vh'}}><IoArrowBackCircleSharp size={50} color='white' style={{marginBottom: '10px', marginTop: '10px', cursor: 'pointer'}}/></Link>
                <h1><b>Blocked Users</b></h1>
            </div>
            <div className="blocked-users-list">
                {!pending ?
                    <>
                        {!error ?
                            <>
                                {blockedUsers.length !== 0 ?
                                    blockedUsers.map((result, i) => 
                                        <div className="blocked-user" key={`${result["blockee"]}`}>
                                            <div className="blocked-user-info">
                                                <img alt="profile-pic" src={`data:image/png;base64,${result["uri"]}`}></img>
                                                <p><b>{`${result["first_name"]}`}</b></p>
                                            </div>
                                            <div className="blocked-user-options">
                                                <button value={`${result["blockee"]}`} id={`btn${i}`} onClick={() => showNotice(i)}>Unblock</button>
                                                <button value={`${result["blockee"]}`} id={`report-btn${i}`} onClick={() => showReportNotice(i)}>Report</button>
                                            </div>
                                        </div>
                                    )
                                    :
                                    <h4>There are no users to unblock!</h4>
                                }
                            </>
                            :
                            <p style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>Error loading blocked users.</p>
                        }
                    </>
                    :
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                        <Spinner />
                        <p style={{marginTop: '10px'}}>Loading...</p>
                    </div>
                }
            </div>
            {/* Modal for unblocking users. */}
            <Modal show={displayModal} onHide={handleCloseModal} centered keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>{`Unblock ${unblockTargetUser}?`}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{marginBottom: 0}}>Are you sure you want to unblock <b>{`${unblockTargetUser}`}</b>?</p>
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={handleUnblock} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Yes</button>
                    <button onClick={handleCloseModal} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>No</button>
                </Modal.Footer>
            </Modal>

            <>
                {/* Modal for reporting users. */}
                <Modal show={displayReportModal} onHide={handleCloseReportModal} backdrop="static" centered keyboard={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>{`Report ${unblockTargetUser}?`}</Modal.Title>
                    </Modal.Header>
                    <form encType="multipart/form-data" method="POST" action="http://localhost:5000/report_user">
                        <Modal.Body>
                            <p>List the reasons as to why you want to report {`${unblockTargetUser}`}.</p>
                            <input type="hidden" value={unblockTargetUser} name="reported-user" />
                            <textarea required aria-setsize={40} maxLength={1000} rows={10} cols={35} onChange={handleDescriptionCharLimit} id="reason-description" name="reason-description" />
                            <br></br>
                            <label><b>{`${inputCharLength}/1000`}</b></label>
                            <br></br>
                            <br></br>
                            <label><b>Document 1</b></label>
                            <input type="file" name='file1' />
                            <br></br>
                            <br></br>
                            <label><b>Document 2</b></label>
                            <input type="file" name='file2' />
                            <br></br>
                            <br></br>
                            <label><b>Document 3</b></label>
                            <input type="file" name='file3' />
                            <br></br>
                            <br></br>
                            <b>Only up to 10 MB of data for each file is allowed.</b>
                        </Modal.Body>
                        <Modal.Footer>
                            <input type="submit" style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}} />
                        </Modal.Footer>
                    </form>
                </Modal>
            </>
        </div>
    )
}