import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Modal from 'react-bootstrap/Modal'
import { Footer } from '../components/Footer'
import logo from '../images/logo.png'

import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

export const Login = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const [showPassword, setShowPassword] = useState(false)

    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    })

    // ===================================================
    // State variables to close and open Bootstrap modals
    // (which is located at the bottom of the page.)

    // NOTE: Section below is from the React Bootstrap
    // website, which is licensed under the MIT license.
    const [displayModal, setDisplayModal] = useState(false)

    const handleClose = () => setDisplayModal(false)
    // ===================================================

    const handleLogin = () => {
        if (credentials.username && credentials.password) {
            const formData = new FormData()
            formData.append('username', credentials.username)
            formData.append('password', credentials.password)

            fetch("http://localhost:5000/login", {
                method: 'POST',
                credentials: 'include',
                body: formData
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw res.status
                }
            }).then((data) => {
                if (data.verified) {
                    setAuthenticated(true)
                    setDisplayModal(true)
                    sessionStorage.setItem("profile_pic", data["profile_pic"])
                    setTimeout(() => {
                        window.location.href = "http://localhost:5173/profile"
                    }, 1000)
                }
            }).catch((error) => {
                console.log(error)
                setDisplayModal(true)
                setErrorMessage("Incorrect username and/or password!")

                setTimeout(() => {
                    setDisplayModal(false)
                }, 3000)
            })
        }
    }

    const displayPassword = () => {
        if (showPassword) {
            setShowPassword(false)
        } else {
            setShowPassword(true)
        }
    }

    // useEffect hook was used to allow password to be shown for 5 seconds only.
    // This was done for security purposes and to protect the credential of the 
    // user.
    useEffect(() => {
        if (showPassword) {
            setTimeout(() => {
                setShowPassword(false)
            }, 5000)
        }
    }, [showPassword])

    return (
        <div className="login-page-container">
            <div className="login-page-form">
                <img src={logo} alt="logo" id="login-logo"></img>
                <br></br>
                <form onSubmit={(e) => {e.preventDefault(); handleLogin()}}>
                    <div className="credentials-input">
                        <input id="login-username" placeholder="Username" required onChange={(e) => setCredentials({...credentials, username: e.target.value})}></input>
                    </div>
                    <div className="credentials-input" id="input-password">
                        { !showPassword ?
                            <>
                                <input id="login-password" placeholder="Password" type="password" onChange={(e) => setCredentials({...credentials, password: e.target.value})} required></input>
                                <IoEyeOutline size={25} onClick={displayPassword} style={{cursor: 'pointer', marginRight: '3%'}} title="Show password"/>
                            </>
                            :
                            <>
                                <input id="login-password" placeholder="Password" onChange={(e) => setCredentials({...credentials, password: e.target.value})} required></input>
                                <IoEyeOffOutline size={25} onClick={displayPassword} style={{cursor: 'pointer', marginRight: '3%'}} title="Hide password"/>
                            </>    
                        }
                    </div>
                    <br></br>
                    <div className="login-page-buttons">
                        <button onClick={() => handleLogin} id="login-button">Sign In</button>
                    </div>
                    <br></br>
                    <div className="login-page-buttons">
                        <h6>Don't have an account?</h6>
                        <Link to="/signup">Sign Up</Link>
                    </div>
                </form>
                <Footer />
            </div>
            <Modal show={displayModal} onHide={handleClose} keyboard={false} backdrop="static" centered>
                {authenticated ?
                    <>
                        <Modal.Header>
                            <Modal.Title>Login Successful</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Logging in...</Modal.Body>
                    </>
                    :
                    <>
                        <Modal.Header>
                            <Modal.Title>Login Failed</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{`${errorMessage}`}</Modal.Body>
                    </>
                }
            </Modal>
        </div>
    )
}