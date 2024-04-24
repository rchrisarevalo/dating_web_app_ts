import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalculateBirthday } from '../functions/CalculateBirthday';
import { listStatesTerritories } from '../functions/listStatesTerritories';

import { Footer } from '../components/Footer';
import { ModalMessage } from '../components/ModalMessage';
import Modal from 'react-bootstrap/Modal';

export const SignUp = () => {
    const [signUpStatusMsg, setSignUpStatusMsg] = useState("")
    const [handleOtherGender, setHandleOtherGender] = useState(false)
    const [uploadedPic, setUploadedPic] = useState("")

    const [charCounter, setCharCounter] = useState(0)

    const [form, setForm] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        username: "",
        password: "",
        birth_month: "",
        birth_date: "",
        birth_year: "",
        state: "Alabama",
        city: "",
        height_feet: "",
        height_inches: "",
        gender: "Female",
        sexual_orientation: "Heterosexual",
        interested_in: "Males",
        so_filter_choice: "",
        relationship_status: "Single",
        interests: "",
        age: 0,
        pic: "",
        checkmarked: false
    })

    const [displayModal, setDisplayModal] = useState(false)
    const [successModal, setDisplaySuccessModal] = useState(false)
    const [failModal, setDisplayFailModal] = useState(false)

    const handleDOB = () => {
        const dob = (document.getElementById("date-of-birth") as HTMLInputElement).value

        const month_name_object: Record<string, string> = {
            "01": "January",
            "02": "February",
            "03": "March",
            "04": "April",
            "05": "May",
            "06": "June",
            "07": "July",
            "08": "August",
            "09": "September",
            "10": "October",
            "11": "November",
            "12": "December"
        }

        if (parseInt(dob.split("-")[2]) <= new Date().getFullYear()) {
            setForm({
                ...form,
                birth_month: month_name_object[dob.split("-")[1]],
                birth_date: dob.split("-")[2],
                birth_year: dob.split("-")[0], 
                age: CalculateBirthday(month_name_object[dob.split("-")[1]], parseInt(dob.split("-")[2]), parseInt(dob.split("-")[0]))
            })
        }
    }

    const isUnderage = (age: number, state: string): boolean => {
        if (age < 18 && (state !== "Mississippi" && state !== "Alabama" && state !== "Nebraska")) {
            return true
        } else if (age < 19 && (state === "Alabama" || state === "Nebraska")) {
            return true
        } else if (age < 21 && state === "Mississippi") {
            return true
        } else {
            return false
        }
    }

    const handleAgreement = () => {
        if (!displayModal) {
            setDisplayModal(true)
        }
    }

    const handleSignUp = () => {
        if (form.checkmarked) {
            setDisplayModal(false)
            if (isUnderage(form.age, form.state)) {
                setDisplayFailModal(true)
                if (form.state === "Alabama" || form.state === "Nebraska") {
                    setSignUpStatusMsg(`You must be 19 or older in the state of ${form.state} to register for an account.`)
                } else if (form.state === "Mississippi") {
                    setSignUpStatusMsg(`You must be 21 or older in the state of ${form.state} to register for an account.`)
                } else {
                    setSignUpStatusMsg(`You must be 18 or older in the state of ${form.state} to register for an account.`)
                }
            } else {
                const form_data = new FormData()

                form_data.append('username', form.username)
                form_data.append('password', form.password)

                fetch('http://localhost:5000/signup', {
                    method: 'POST',
                    body: JSON.stringify(form),
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
                    if (data.message === "Failed!") {
                        setDisplayFailModal(true)
                        setSignUpStatusMsg("This username has been taken!")
                    } else {
                        setDisplaySuccessModal(true)
                        setSignUpStatusMsg("Sign up successful!")

                        fetch("http://localhost:5000/login", {
                            method: 'POST',
                            credentials: 'include',
                            body: form_data
                        }).then((res) => {
                            if (res.ok) {
                                return res.json()
                            } else {
                                throw res.status
                            }
                        }).then((data) => {
                            if (data.verified) {
                                setTimeout(() => {
                                    window.location.href = "http://localhost:5173/profile"
                                }, 1000)
                            }
                        }).catch((error) => {
                            console.log(error)
                        })
                    }
                }).catch((error) => {
                    console.log(error)
                })
            }
        } else {
            setDisplayFailModal(true)
            setSignUpStatusMsg("Click on the check mark if you want to register for an account.")
        }
    }

    const handleCharCounter = () => {
        const description = (document.getElementById("bio-check") as HTMLInputElement).value
        setCharCounter(description.length)
    }

    const handle_gender = () => {
        const gender_option = (document.getElementById("gender-check") as HTMLInputElement).value

        if (gender_option == "Other") {
            setHandleOtherGender(true)
            setForm({...form, gender: gender_option})
        } else {
            setHandleOtherGender(false)
            setForm({...form, gender: gender_option})
        }
    }

    const handleImage = () => {
        const image = (document.getElementById("upload-pic-input") as HTMLInputElement)
        const form_data = new FormData()
        
        if (image.files !== null)
        {
            form_data.append("pic", image.files[0])

            fetch("http://localhost:5000/retrieve_pic", {
                method: 'POST',
                body: form_data,
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw res.status
                }
            }).then((data) => {
                setUploadedPic(data.pic)
                setForm({...form, pic: data.pic})
            }).catch((error) => {
                console.log(error)
            })
        }
    }

    const states_territories = listStatesTerritories()

    return (
        <div className="signup-page-container">
            <div className="signup-page-form">
                <span style={{marginLeft: '10%'}}>
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
                </span>
                <h1>Sign Up For An Account</h1>
                <h5>
                    <i>
                        Remember, you have to be 18 or older to register for an account. Deliberately
                        providing false information about your identity may result in your account
                        being terminated.
                    </i>
                </h5>
                <h5>
                    <i>
                        If you have any questions, please feel free to refer to the <b>Terms of Service</b> or the <b>Privacy Policy</b>.
                    </i>
                </h5>
                <form onSubmit={(e) => {e.preventDefault(); handleAgreement()}}>
                    <div className="form-wrapper">
                        <label>First Name</label>
                        <br></br>
                        <input id="login-first-name" required onChange={(e) => setForm({...form, first_name: e.target.value})} />
                        <br></br>

                        <label>Middle Name</label>
                        <br></br>
                        <input id="login-middle-name" onChange={(e) => setForm({...form, middle_name: e.target.value})} />
                        <br></br>

                        <label>Last Name</label>
                        <br></br>
                        <input id="login-last-name" required onChange={(e) => setForm({...form, last_name: e.target.value})}/>
                        <br></br>

                        <label>Username</label>
                        <br></br>
                        <input id="login-username" required onChange={(e) => setForm({...form, username: e.target.value})}/>
                        <br></br>

                        <label>Password</label>
                        <br></br>
                        <input id="login-password" type="password" required onChange={(e) => setForm({...form, password: e.target.value})}/>
                        <br></br>
                        
                        <div className="date-of-birth-buttons">    
                            <label>Date Of Birth (DOB)</label>
                            <br></br>
                            <input type="date" id="date-of-birth" onChange={handleDOB} required></input>
                        </div>
                        <div className="state-selection-buttons">
                            <label>State/Territory Residence</label>
                            <br></br>
                            <select id="state-check" required onChange={(e) => setForm({...form, state: e.target.value})}>
                                <optgroup label="States">
                                    {states_territories[0].map((state: string) =>
                                        <option value={`${state}`}>{`${state}`}</option>
                                    )}
                                </optgroup>
                                <optgroup label="Territories/Districts">
                                    {states_territories[1].map((territory: string) =>
                                        <option value={`${territory}`}>{`${territory}`}</option>
                                    )}
                                </optgroup>
                            </select>
                        </div>
                        <label>City Residence</label>
                        <br></br>
                        <input required placeholder="Enter your city..." id="city-check" maxLength={85} onChange={(e) => setForm({...form, city: e.target.value})} />
                        <br></br>
                        <div className="height-buttons">
                            <label>Height</label>
                            <br></br>
                            <input required placeholder="Feet" id="height-feet" size={3} maxLength={1} max={9} onChange={(e) => setForm({...form, height_feet: e.target.value})} />
                            <input required placeholder="Inches" id="height-inches" size={4} maxLength={2} max={11} onChange={(e) => setForm({...form, height_inches: e.target.value})} />
                        </div>
                        <div className="gender-select-buttons">
                            <label>Gender</label>
                            <br></br>
                            <select id="gender-check" onChange={handle_gender} required>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Transgender Man">Transgender Man</option>
                                <option value="Transgender Woman">Transgender Woman</option>
                                <option value="Other">Other</option>
                                <option value="I'd prefer not to say">I'd prefer not to say</option>
                            </select>
                            {handleOtherGender &&
                                <div>
                                    <br></br>
                                    <label>If other, how do you identify yourself as? </label>
                                    <br></br>
                                    <input id="other_gender"></input>
                                </div>
                            }
                        </div>
                        <div className="sexual-orientation-buttons">
                            <label>Sexual Orientation</label>
                            <br></br>
                            <select id="sexual-orientation-check" required onChange={(e) => setForm({...form, sexual_orientation: e.target.value})}>
                                <option value="Heterosexual">Heterosexual</option>

                                {(form.gender === "Female" || form.gender === "Transgender Woman") &&
                                    <option value="Homosexual (Lesbian)">Homosexual (Lesbian)</option>
                                }

                                {(form.gender === "Male" || form.gender === "Transgender Man") &&
                                    <option value="Homosexual (Gay)">Homosexual (Gay)</option>
                                }

                                {(form.gender === "Non-binary" || form.gender === "Other") &&
                                    <option value="Homosexual (Gay)">Homosexual (Gay)</option>
                                }

                                {(form.gender === "Non-binary" || form.gender === "Other") &&
                                    <option value="Homosexual (Lesbian)">Homosexual (Lesbian)</option>
                                }

                                <option value="Bisexual">Bisexual</option>
                                <option value="Pansexual">Pansexual</option>
                                <option value="Queer">Queer</option>
                                <option value="Asexual">Asexual</option>
                                <option value="Deciding">Deciding</option>
                                <option value="I'd prefer not to say">I'd prefer not to say</option>
                            </select>
                        </div>
                        <div className="interested-in-gender-buttons">
                            <label>Interested In</label>
                            <br></br>
                            <select id="interested-in-check" required onChange={(e) => setForm({...form, interested_in: e.target.value})}>
                                <option value="Males">Males</option>
                                <option value="Females">Females</option>
                                <option value="Males, Females">Males, Females</option>
                                <option value="Enbies">Non-binary</option>
                                <option value="Anyone">Anyone</option>
                                <option value="Deciding">Deciding</option>
                                <option value="Nobody">Nobody</option>
                                <option value="Multiple gender interests">Multiple gender interests</option>
                                <option value="I'd prefer not to say">I'd prefer not to say</option>
                            </select>
                            <br></br>
                            <label>Filter search results based on your sexual orientation?</label>
                            <br></br>
                            <label style={{fontWeight: 300}}>
                                <i>
                                    By choosing "Yes", your account settings will be configured to show results based on your sexual
                                    orientation only while simultaneously comparing your interests and other profile information with 
                                    other users during the matching process.
                                </i>
                                <br></br>
                                <br></br>
                                <i>
                                    Otherwise, users will be recommended to you with the aforementioned criteria, regardless of your
                                    sexual orientation.
                                </i>
                            </label>
                            <br></br>
                            <select id="so-filter-check" required onChange={(e) => setForm({...form, so_filter_choice: e.target.value})}>
                                <option value="Select">Select</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div className="relationship-status-buttons">
                            <label>Relationship Status</label>
                            <br></br>
                            <select id="relationship-status-check" required onChange={(e) => setForm({...form, relationship_status: e.target.value})}>
                                <option value="Single">Single</option>
                                <option value="Taken">Taken</option>
                                <option value="Engaged">Engaged</option>
                                <option value="Married">Married</option>
                                <option value="Separated">Separated</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Hard to explain">Hard to explain</option>
                                <option value="It's a secret!">It's a secret!</option>
                            </select>
                        </div>
                        <label>Describe Yourself</label>
                        <br></br>
                        <textarea required placeholder="Describe yourself..." id="bio-check" onChange={(e) => { handleCharCounter(); setForm({...form, interests: e.target.value}) }} maxLength={300} rows={10} cols={60}/>
                        {charCounter > 0 ? <p style={{color: 'white'}}>{`${charCounter}/300`}</p> : <></>}
                        <br></br>
                        <br></br>
                        <label>Upload Profile Picture</label>
                        <br></br>
                        {uploadedPic !== "" ? <img src={`data:image/png;base64,${uploadedPic}`} alt="uploaded-pic" id="uploaded-pic" style={{width: '200px', height: '200px', objectFit: 'cover'}}></img> : <></>}
                        <br></br>
                        <input type="file" required id="upload-pic-input" onChange={handleImage} accept="image/*" name="pic"/>
                        <div className="signup-page-button" id="signup-button">
                            <Link to="/">Back</Link>
                            <button onClick={() => handleSignUp}>Sign Up</button>
                        </div>
                    </div>
                </form>
                <ModalMessage displayModal={displayModal} setDisplayModal={setDisplayModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Agreement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        By clicking the checkmark below, you agree that you are <b>18 years or older</b> -- <b>19 if you reside in Nebraska or Alabama, or 21 if you reside in Mississippi</b> --
                        to use the Service.
                    </Modal.Body>
                    <Modal.Body>
                        Failure to provide valid information and subsequent discovery of said invalid information will result in your account 
                        being <b>permanently terminated</b> to protect the safety of our users and to maintain the integrity of the Service.
                    </Modal.Body>
                    <Modal.Body>
                        <input type="checkbox" required id="checkmark-agreement" onChange={(e) => {setForm({...form, checkmarked: e.target.checked})}} /><i style={{marginLeft: '10px'}}>By clicking this checkmark, you agree with the above.</i>
                    </Modal.Body>
                    <Modal.Footer>
                        {form.checkmarked ? 
                            <button onClick={() => handleSignUp()} style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}}>Confirm</button> 
                            : 
                            <button style={{border: 'none', background: 'black', color: 'white', padding: '7px 15px', borderRadius: '20px'}} disabled>Confirm</button>}
                    </Modal.Footer>
                </ModalMessage>
                <ModalMessage displayModal={successModal} setDisplayModal={setDisplayModal}>
                    <Modal.Header>
                        <Modal.Title>Sign up successful!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        You successfully signed up for an account! Redirecting you to your profile page...
                    </Modal.Body>
                </ModalMessage>
                <ModalMessage displayModal={failModal} setDisplayModal={setDisplayModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Sign up failed!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {signUpStatusMsg}
                    </Modal.Body>
                </ModalMessage>
            </div>
            <Footer />
        </div>
    )
}