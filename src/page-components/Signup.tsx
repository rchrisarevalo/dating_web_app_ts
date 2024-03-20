import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalculateBirthday } from '../functions/CalculateBirthday';
import { listStatesTerritories } from '../functions/listStatesTerritories';

import logo from '../images/logo.png';

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
                <img src={logo} alt="logo"></img>
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
                        {uploadedPic !== "" ? <img src={`data:image/png;base64,${uploadedPic}`} alt="uploaded-pic" id="uploaded-pic"></img> : <></>}
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