import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'

import { useFetchAlgoConfig } from '../hooks/useFetchSearch'

import { IoArrowBackCircleSharp } from 'react-icons/io5'
import { Spinner } from 'react-bootstrap'

interface PrivacySettingsProps {
    username: string
    auth: boolean
}

export const PrivacySettings = (props: PrivacySettingsProps) => {
    const { username, auth } = props
    const { algo_config, use_so_filter, algo_pending, algo_error } = useFetchAlgoConfig("http://localhost:5000/privacy/check_recommendation_settings", auth)

    const [displayModal, setDisplayModal] = useState(false)
    const [displaySOFilterModal, setDisplaySOFilterModal] = useState(false)
    const [check, setCheck] = useState(algo_config)
    const [SOCheck, setSOCheck] = useState(false)

    const handleOpenRecommendModal = () => setDisplayModal(true)
    const handleCloseRecommendModal = () => {
        setDisplayModal(false)
        setCheck(algo_config)
    }

    const handleOpen_SO_Filter_Modal = () => setDisplaySOFilterModal(true)
    const handleClose_SO_Filter_Modal = () => {
        setDisplaySOFilterModal(false)
    }

    // Function that keeps track of the state of the check variable.
    const handleCheck = () => {
        if (check) {
            setCheck(false)
        } else {
            setCheck(true)
        }
    }

    const handle_SO_Filter_Check = () => {
        if (SOCheck) {
            setSOCheck(false)
        } else {
            setSOCheck(true)
        }
    }

    const submitRecommendationSetting = async () => {
        const check_box = (document.getElementById("recommend-check") as HTMLInputElement)
        let check_variable = ""

        if (check_box.checked) {
            check_variable = "true"
        } else {
            check_variable = "false"
        }

        fetch('http://localhost:5000/privacy/change_recommendation_settings?rs=match', {
            method: 'PUT',
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                check_value: check_variable
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.ok) {
                return res.json()
            } else {
                return res.status
            }
        }).then((data) => {
            if (data.message === 'true') {
                setCheck(true)
            } else {
                setCheck(false)
            }
            window.location.reload()
        }).catch((error) => {
            console.log(error)
        })

        setDisplayModal(false)
    }

    const submitSOFilterSetting = async () => {
        const so_filter_check_box = (document.getElementById("so-filter-check") as HTMLInputElement)
        let check_value = ""

        if (so_filter_check_box.checked) {
            check_value = "true"
        } else {
            check_value = "false"
        }

        fetch('http://localhost:5000/privacy/change_recommendation_settings?rs=so_filter', {
            method: 'PUT',
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                check_value: check_value
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
            if (data.message === 'true') {
                setSOCheck(true)
            } else {
                setSOCheck(false)
            }
            window.location.reload()
        }).catch((error) => {
            console.log(error)
        })

        setDisplaySOFilterModal(false)
    }

    // useEffect was used to change the status of the check state variable after
    // running the handleCheck function.
    useEffect(() => {
        setCheck(algo_config)
        setSOCheck(use_so_filter)
    }, [algo_config, use_so_filter])

    return (
        <div className="privacy-settings-container">
            <Link to="/profile/options" style={{width: '6vh'}}><IoArrowBackCircleSharp size={50} color='white' style={{marginBottom: '10px', marginTop: '10px', cursor: 'pointer'}}/></Link>
            <Link className="privacy-settings-option" to="/profile/options/privacy/view_blocked_users">
                <h3>View Blocked Users</h3>
                <br></br>
                <i>View users you blocked over the course of your time using the Dating App.</i>
            </Link>
            <button className="privacy-settings-option" onClick={handleOpenRecommendModal}>
                <h3>Use Matching Algorithm</h3>
                <br></br>
                <i>If you wish, click on this setting to configure if you want users recommended to you based on your interests, city and state residence, etc.</i>
            </button>
            <button className="privacy-settings-option" onClick={handleOpen_SO_Filter_Modal}>
                <h3>Use Sexual Orientation Filter</h3>
                <br></br>
                <i>Filter users based on your sexual orientation and gender preference if you wish to do so.</i>
            </button>
            <Link className="privacy-settings-option" to="/profile/options/privacy/download_information">
                <h3>Download Your Information</h3>
                <br></br>
                <i>
                    Click here to download your information associated with your account, whether it'd be your messages,
                    search history, etc.
                </i>
            </Link>
            <br></br>
            <br></br>
            <br></br>
            <Modal show={displayModal} onHide={handleCloseRecommendModal} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change recommendation settings</Modal.Title>
                </Modal.Header>
                <>
                    {!algo_pending ?
                        !algo_error ?
                            <>
                                <Modal.Body>
                                    {check ? <input type="checkbox" checked onClick={handleCheck} id="recommend-check"></input> : <input type="checkbox" onClick={handleCheck} id="recommend-check"></input>}
                                    <label style={{marginRight: '10px', marginLeft: '10px'}}><b>Use matching algorithm</b></label>
                                </Modal.Body>
                                <Modal.Footer>
                                    <button onClick={submitRecommendationSetting} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Confirm</button>
                                    <button onClick={handleCloseRecommendModal} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Cancel</button>
                                </Modal.Footer>
                            </>
                            :
                            <>
                                <Modal.Body>
                                    <p>Error loading settings!</p>
                                </Modal.Body>
                                <Modal.Footer>
                                    <button onClick={() => window.location.reload} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Reload</button>
                                </Modal.Footer>
                            </>
                        :
                        <Modal.Body>
                            <Spinner />
                        </Modal.Body>
                    }
                </>
            </Modal>
            <Modal show={displaySOFilterModal} onHide={handleClose_SO_Filter_Modal} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change sexual orientation filter settings</Modal.Title>
                </Modal.Header>
                {!algo_pending ?
                    !algo_error ?
                        <>
                            <Modal.Body>
                                {SOCheck ? <input type="checkbox" checked onClick={handle_SO_Filter_Check} id="so-filter-check"></input> : <input type="checkbox" onClick={handle_SO_Filter_Check} id="so-filter-check"></input>}
                                <label style={{marginRight: '10px', marginLeft: '10px'}}><b>Use sexual orientation filter</b></label>
                            </Modal.Body>
                            <Modal.Footer>
                                <button onClick={submitSOFilterSetting} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Confirm</button>
                                <button onClick={handleClose_SO_Filter_Modal} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Cancel</button>
                            </Modal.Footer>
                        </>
                        :
                        <>
                            <Modal.Body>
                                <p>Error loading settings!</p>
                            </Modal.Body>
                            <Modal.Footer>
                                <button onClick={() => window.location.reload} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Reload</button>
                            </Modal.Footer>
                        </>
                    :
                    <Modal.Body>
                        <Spinner />
                    </Modal.Body>
                }
            </Modal>
        </div>
    )
}