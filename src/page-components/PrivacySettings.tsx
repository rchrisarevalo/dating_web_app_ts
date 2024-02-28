import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'

import { IoArrowBackCircleSharp } from 'react-icons/io5'
import { useFetchAlgoConfig } from '../hooks/useFetchSearch'

interface PrivacySettingsProps {
    username: string
}

export const PrivacySettings = (props: PrivacySettingsProps) => {
    const { username } = props

    const { algo_config } = useFetchAlgoConfig("http://localhost:5000/privacy/check_recommendation_settings")

    const [displayModal, setDisplayModal] = useState(false)
    const [check, setCheck] = useState(algo_config)

    const handleOpenRecommendModal = () => setDisplayModal(true);
    const handleCloseRecommendModal = () => {
        setDisplayModal(false)
        setCheck(algo_config)
    }

    // Function that keeps track of the state of the check variable.
    const handleCheck = () => {
        if (check) {
            setCheck(false)
        } else {
            setCheck(true)
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

        fetch('http://localhost:5000/privacy/change_recommendation_settings', {
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
        }).catch((error) => {
            console.log(error)
        })

        setDisplayModal(false)
    }

    // useEffect was used to change the status of the check state variable after
    // running the handleCheck function.
    useEffect(() => {
        setCheck(algo_config)
    }, [algo_config])

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
                <Modal.Body>
                    {check ? <input type="checkbox" checked onClick={handleCheck} id="recommend-check"></input> : <input type="checkbox" onClick={handleCheck} id="recommend-check"></input>}
                    <label style={{marginRight: '10px', marginLeft: '10px'}}><b>Use matching algorithm</b></label>
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={submitRecommendationSetting} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Confirm</button>
                    <button onClick={handleCloseRecommendModal} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Cancel</button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}