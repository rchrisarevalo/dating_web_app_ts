import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Modal from 'react-bootstrap/Modal'
import { Footer } from '../components/Footer'

import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

export const Login = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [loginPending, setLoginPending] = useState(true)
    const [loginError, setLoginError] = useState(false)
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
            setDisplayModal(true)
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
                    throw res
                }
            }).then((data) => {
                if (data.verified) {
                    setLoginPending(false)
                    setLoginError(false)
                    setAuthenticated(true)
                    sessionStorage.setItem("profile_pic", data["profile_pic"])
                    setTimeout(() => {
                        window.location.href = "http://localhost:5173/profile"
                    }, 1000)
                }
            }).catch((error: Response) => {
                console.log(error)
                setLoginPending(false)
                setLoginError(true)
                setAuthenticated(false)
                
                if (error.status != 429) {
                    setErrorMessage("Incorrect username and/or password.")
                } else {
                    setErrorMessage(error.statusText)
                }

            }).finally(() => {
                setTimeout(() => {
                    setLoginPending(true)
                    setLoginError(false)
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
                <svg width="325" height="150" viewBox="0 0 649 258" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M136 53.5C136 83.0472 112.047 107 82.5 107C52.9528 107 29 83.0472 29 53.5C29 23.9528 52.9528 0 82.5 0C112.047 0 136 23.9528 136 53.5Z" fill="white"/>
                    <path d="M307 53.5C307 83.0472 283.047 107 253.5 107C223.953 107 200 83.0472 200 53.5C200 23.9528 223.953 0 253.5 0C283.047 0 307 23.9528 307 53.5Z" fill="white"/>
                    <path d="M82 102L126.167 186H37.8327L82 102Z" fill="white"/>
                    <path d="M233 102H273V191H233V102Z" fill="white"/>
                    <path d="M0 194.946L81.1913 106L88.5241 112.694L7.33283 201.639L0 194.946Z" fill="white"/>
                    <path d="M162 182.132L245.672 101L252.584 108.128L168.911 189.26L162 182.132Z" fill="white"/>
                    <path d="M165.432 185.691L76.3918 114.39L82.5978 106.64L171.637 177.941L165.432 185.691Z" fill="white"/>
                    <path d="M307.319 201.966L253 94.478L261.861 90L316.18 197.488L307.319 201.966Z" fill="white"/>
                    <path d="M70 179H76V258H70V179Z" fill="white"/>
                    <path d="M264 188H272V258H264V188Z" fill="white"/>
                    <path d="M234 188H242V258H234V188Z" fill="white"/>
                    <path d="M90 179H96V258H90V179Z" fill="white"/>
                    <path d="M345.75 140V103.2H356.75C360.45 103.2 363.6 103.75 366.2 104.85C368.8 105.95 370.883 107.417 372.45 109.25C374.05 111.083 375.217 113.133 375.95 115.4C376.683 117.667 377.05 119.95 377.05 122.25C377.05 124.983 376.55 127.45 375.55 129.65C374.583 131.817 373.25 133.683 371.55 135.25C369.85 136.783 367.883 137.967 365.65 138.8C363.417 139.6 361.05 140 358.55 140H345.75ZM353 133H357.3C359.133 133 360.8 132.767 362.3 132.3C363.8 131.8 365.083 131.083 366.15 130.15C367.25 129.217 368.083 128.05 368.65 126.65C369.25 125.217 369.55 123.583 369.55 121.75C369.55 119.35 369.15 117.4 368.35 115.9C367.583 114.367 366.617 113.183 365.45 112.35C364.317 111.517 363.15 110.95 361.95 110.65C360.75 110.317 359.733 110.15 358.9 110.15H353V133Z" fill="white"/>
                    <path d="M377.635 140L394.235 101.75H394.635L411.235 140H402.835L392.235 113.1L397.485 109.5L384.785 140H377.635ZM388.985 126.7H400.035L402.585 132.8H386.735L388.985 126.7Z" fill="white"/>
                    <path d="M411.121 103.2H435.921V110.2H426.971V140H419.721V110.2H411.121V103.2Z" fill="white"/>
                    <path d="M442.918 103.2H450.168V140H442.918V103.2Z" fill="white"/>
                    <path d="M492.616 141.5L464.716 116.3L466.866 117.5L467.016 140H459.666V101.75H459.966L487.266 126.85L485.666 126.15L485.516 103.2H492.816V141.5H492.616Z" fill="white"/>
                    <path d="M532.143 136.3C531.71 136.767 531.026 137.25 530.093 137.75C529.16 138.217 528.076 138.65 526.843 139.05C525.643 139.45 524.41 139.767 523.143 140C521.876 140.267 520.676 140.4 519.543 140.4C516.543 140.4 513.843 139.967 511.443 139.1C509.043 138.2 506.993 136.967 505.293 135.4C503.593 133.8 502.293 131.917 501.393 129.75C500.493 127.583 500.043 125.217 500.043 122.65C500.043 119.283 500.543 116.367 501.543 113.9C502.576 111.4 503.96 109.333 505.693 107.7C507.46 106.033 509.476 104.8 511.743 104C514.043 103.2 516.443 102.8 518.943 102.8C521.31 102.8 523.476 103.067 525.443 103.6C527.41 104.1 529.076 104.733 530.443 105.5L528.093 112.25C527.493 111.917 526.693 111.583 525.693 111.25C524.693 110.917 523.676 110.65 522.643 110.45C521.61 110.217 520.693 110.1 519.893 110.1C517.893 110.1 516.126 110.35 514.593 110.85C513.06 111.35 511.76 112.1 510.693 113.1C509.66 114.1 508.876 115.35 508.343 116.85C507.81 118.317 507.543 120.033 507.543 122C507.543 123.733 507.843 125.3 508.443 126.7C509.043 128.067 509.876 129.233 510.943 130.2C512.043 131.167 513.326 131.9 514.793 132.4C516.293 132.9 517.943 133.15 519.743 133.15C520.776 133.15 521.726 133.083 522.593 132.95C523.46 132.783 524.193 132.533 524.793 132.2V127.75H518.443V120.75H532.143V136.3Z" fill="white"/>
                    <path d="M552.489 140L569.089 101.75H569.489L586.089 140H577.689L567.089 113.1L572.339 109.5L559.639 140H552.489ZM563.839 126.7H574.889L577.439 132.8H561.589L563.839 126.7Z" fill="white"/>
                    <path d="M602.603 103.2C605.636 103.2 608.203 103.717 610.303 104.75C612.403 105.75 614.003 107.183 615.103 109.05C616.203 110.883 616.753 113.067 616.753 115.6C616.753 117.1 616.52 118.617 616.053 120.15C615.62 121.65 614.903 123.017 613.903 124.25C612.936 125.483 611.62 126.483 609.953 127.25C608.32 127.983 606.303 128.35 603.903 128.35H598.703V140H591.453V103.2H602.603ZM603.853 121.3C604.953 121.3 605.87 121.117 606.603 120.75C607.336 120.35 607.903 119.867 608.303 119.3C608.736 118.7 609.036 118.083 609.203 117.45C609.403 116.817 609.503 116.267 609.503 115.8C609.503 115.433 609.436 114.95 609.303 114.35C609.203 113.717 608.97 113.083 608.603 112.45C608.237 111.817 607.67 111.283 606.903 110.85C606.17 110.417 605.17 110.2 603.903 110.2H598.703V121.3H603.853Z" fill="white"/>
                    <path d="M634.39 103.2C637.424 103.2 639.99 103.717 642.09 104.75C644.19 105.75 645.79 107.183 646.89 109.05C647.99 110.883 648.54 113.067 648.54 115.6C648.54 117.1 648.307 118.617 647.84 120.15C647.407 121.65 646.69 123.017 645.69 124.25C644.724 125.483 643.407 126.483 641.74 127.25C640.107 127.983 638.09 128.35 635.69 128.35H630.49V140H623.24V103.2H634.39ZM635.64 121.3C636.74 121.3 637.657 121.117 638.39 120.75C639.124 120.35 639.69 119.867 640.09 119.3C640.524 118.7 640.824 118.083 640.99 117.45C641.19 116.817 641.29 116.267 641.29 115.8C641.29 115.433 641.224 114.95 641.09 114.35C640.99 113.717 640.757 113.083 640.39 112.45C640.024 111.817 639.457 111.283 638.69 110.85C637.957 110.417 636.957 110.2 635.69 110.2H630.49V121.3H635.64Z" fill="white"/>
                </svg>
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
                    <div className="login-page-buttons">
                        <button onClick={() => handleLogin} id="login-button">Sign In</button>
                    </div>
                    <br></br>
                    <div className="login-page-buttons">
                        <h6>Don't have an account?</h6>
                        <Link to="/signup">Sign Up</Link>
                    </div>
                </form>
            </div>
            <Footer />
            <Modal show={displayModal} onHide={handleClose} keyboard={false} backdrop="static" centered>
                {!loginPending ?
                    !loginError ?
                        authenticated && !loginError &&
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
                    :
                    <>
                        <Modal.Header>
                            <Modal.Title>Processing...</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Processing log in...</Modal.Body>
                    </>
                }
            </Modal>
        </div>
    )
}