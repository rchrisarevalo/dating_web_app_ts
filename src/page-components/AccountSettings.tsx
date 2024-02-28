import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { IoArrowBackCircleSharp } from 'react-icons/io5'
import { Link } from 'react-router-dom'

interface AccountSettingsProps {
    username: string
}

export const AccountSettings = (props: AccountSettingsProps) => {
    const { username } = props

    const [displayModal, setDisplayModal] = useState(false)
    const [displayResetPasswordModal, setDisplayResetPasswordModal] = useState(false)
    const [displayPrivacySettingsModal, setDisplayPrivacySettingsModal] = useState(false)
    const [errorMsg, setErrorMsg] = useState(false)

    const handleOpenModal = () => setDisplayModal(true)
    const handleCloseModal = () => setDisplayModal(false)

    const handleResetPasswordOpenModal = () => setDisplayResetPasswordModal(true)
    const handleResetPasswordCloseModal = () => setDisplayResetPasswordModal(false)

    const handlePrivacySettingsOpenModal = () => setDisplayPrivacySettingsModal(true)
    const handlePrivacySettingsCloseModal = () => setDisplayPrivacySettingsModal(false)

    const handleUpdatePassword = () => {
        const old_password_input = (document.getElementById("old-password-change-input") as HTMLInputElement).value
        const new_password_input = (document.getElementById("new-password-change-input") as HTMLInputElement).value

        if (old_password_input && new_password_input) {
            const information: Record<string, string> = {
                username: username,
                old_password: old_password_input,
                new_password: new_password_input
            }

            fetch("http://localhost:5000/update_password", {
                method: 'PUT',
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
                setErrorMsg(false)
                setDisplayResetPasswordModal(false)
            }).catch((error) => {
                console.log(error)
                setErrorMsg(true)
            })
        } else {
            setErrorMsg(true)
        }
    }

    const handleDeleteAccount = () => {
        fetch("http://localhost:5000/delete_account", {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                username: username
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
        }).then(() => {
            sessionStorage.removeItem("username")
            sessionStorage.removeItem("profile_pic")
            window.location.href = "http://localhost:5173"
        }).catch((error) => {
            console.log(error)
        })
    }

    return (
        <div className="account-settings-container">
            <Link to="/profile/options" style={{width: '6vh'}}><IoArrowBackCircleSharp size={50} color='white' style={{marginBottom: '10px', marginTop: '10px', cursor: 'pointer'}}/></Link>
            <button className="account-settings-option" onClick={handlePrivacySettingsOpenModal}>
                <h3>Account Status (Coming Soon)</h3>
                <br></br>
                <i>Check your account for any violations of the policies that you have incurred.</i>
            </button>
            <button className="account-settings-option" onClick={handleResetPasswordOpenModal}>
                <h3>Update Your Password</h3>
                <br></br>
                <i>To reset your password, please enter your old password before resetting it with your new password.</i>
            </button>
            <button className="account-settings-option" onClick={handleOpenModal}>
                <h3>Delete Your Account</h3>
                <br></br>
                <i>To delete your account, please refer to the Terms of Service and Privacy Policy to know what data we will retain after the deletion of your account.</i>
            </button>
            <br></br>
            <br></br>
            <br></br>
            <Modal show={displayModal} onHide={handleCloseModal} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title><b>Account Deletion</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete your account? This change will be permanent and you will NOT be allowed to create another account.</Modal.Body>
                <Modal.Footer>
                    <button onClick={handleDeleteAccount} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Yes</button>
                    <button onClick={handleCloseModal} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>No</button>
                </Modal.Footer>
            </Modal>
            <Modal show={displayResetPasswordModal} onHide={handleResetPasswordCloseModal} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title><b>Reset Password</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>To reset your password, please fill in the input boxes below:</Modal.Body>
                <Modal.Body>
                    <label><b style={{fontSize: 17, marginLeft: '4px'}}>Enter your old password:</b></label>
                    <br></br>
                    <br></br>
                    <input placeholder="Enter your old password" id="old-password-change-input" type='password'></input>
                    <br></br>
                    <br></br>
                    <label><b style={{fontSize: 17, marginLeft: '4px'}}>Enter your new password:</b></label>
                    <br></br>
                    <br></br>
                    <input placeholder="Enter your new password" id="new-password-change-input" type='password'></input>
                    <br></br>
                    <br></br>
                    {errorMsg ? <><b>You did not enter one or any of your passwords correctly!</b></> : <></>}
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={handleUpdatePassword} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Reset Password</button>
                </Modal.Footer>
            </Modal>
            <Modal show={displayPrivacySettingsModal} onHide={handlePrivacySettingsCloseModal} keyboard={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title><b>This feature is not available yet!</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>Hi there! This feature is not available yet! Come back at a later date.</Modal.Body>
            </Modal>
        </div>
    )
}