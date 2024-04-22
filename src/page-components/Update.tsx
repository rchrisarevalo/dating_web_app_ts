import { useState, useEffect } from 'react';
import { CalculateBirthday } from '../functions/CalculateBirthday';
import { socket_conn } from '../functions/SocketConn';
import { MonthToNum, NumToMonth } from '../functions/Calendar';
import { Link } from 'react-router-dom';
import { IoArrowBackCircleSharp } from 'react-icons/io5';

interface UpdateProps {
    username: string
}

export const Update = (props: UpdateProps) => {
    const { username } = props

    const [profile, setProfile] = useState({
        profile_pic: "",
        name: "",
        bio: "",
        height: "",
        gender: "",
        sexual_orientation: "",
        relationship_status: "",
        birth_month: "",
        birth_date: "",
        birth_year: ""
    })

    const [DOBChange, setDOBChange] = useState(false)

    const [change, setChange] = useState(false)

    // State variable that will determine whether to display an input form for people
    // who identify as another gender apart from male, female, and non-binary.
    const [handleOtherGender, setHandleOtherGender] = useState(false)

    // State variable that will handle the changing input from the bio section.
    const [handleBioText, setHandleBioText] = useState("")

    // State variables that will handle the changing input from the change name
    // section.
    const [handleFirstName, setHandleFirstName] = useState("")
    const [handleMiddleName, setHandleMiddleName] = useState("")
    const [handleLastName, setHandleLastName] = useState("")

    // State variables that will handle the changing input from the change
    // DOB section.
    const [handleBirthMonth, setHandleBirthMonth] = useState("")
    const [handleBirthDate, setHandleBirthDate] = useState("")
    const [handleBirthYear, setHandleBirthYear] = useState("")

    const [handleDOB, setHandleDOB] = useState("")

    // State variable that will contain a message saying that you cannot
    // be under 18 if attempting to change the date of birth that is below
    // the age of majority as required to use this service.
    const [warning, setWarning] = useState(false)

    // State variable that handles socket connection.
    // eslint-disable-next-line no-unused-vars
    const [connection] = useState(socket_conn)

    // State variable that stores error status.
    const [error, setError] = useState(false)

    // State variable that stores pending request status.
    const [pending, setPending] = useState(true)

    // State variable that stores current character count
    // of bio.
    const [curBioCharCount, setCurBioCharCount] = useState(0)

    useEffect(() => {
        const retrieveProfile = async () => {
            const res = await fetch("http://localhost:4000/profile", {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({})
            })

            if (res.ok) {
                const data = await res.json()
                setProfile({
                    profile_pic: data.uri,
                    name: `${data.first_name} ${data.middle_name} ${data.last_name}`,
                    bio: data.interests,
                    height: data.height,
                    gender: data.gender,
                    sexual_orientation: data.sexual_orientation,
                    relationship_status: data.relationship_status,
                    birth_month: data.birth_month,
                    birth_date: data.birth_date,
                    birth_year: data.birth_year
                })
                setPending(false)
            } else {
                setPending(false)
                setError(true)
            }
        }
        retrieveProfile()
    }, [username])

    useEffect(() => {
        setHandleBioText(profile.bio)
        setCurBioCharCount(profile.bio.length)
        if (profile.name !== "") {
            setHandleFirstName(profile.name.split(" ")[0])
            setHandleMiddleName(profile.name.split(" ")[1])
            setHandleLastName(profile.name.split(" ")[2])
        }
        setHandleDOB(`${profile.birth_year}-${MonthToNum(profile.birth_month)}-${profile.birth_date}`)
        setHandleBirthDate(profile.birth_date)
        setHandleBirthMonth(profile.birth_month)
        setHandleBirthYear(profile.birth_year)
    }, [profile.bio, profile.name, profile.birth_date, profile.birth_month, profile.birth_year])

    const display_dob_change = () => {
        if (DOBChange === false) {
            setDOBChange(true)
        } else {
            if (warning) {
                setWarning(false)
            }
            setDOBChange(false)
        }
    }

    const display_change = () => {
        if (!change) {
            setChange(true)
        } else {
            setChange(false)
        }
    }

    const display_other_gender = () => {
        const gender_select = (document.getElementById("gender-select") as HTMLInputElement).value

        if (gender_select === "Other") {
            setHandleOtherGender(true)
        } else {
            setHandleOtherGender(false)
        }
    }

    const submit_name_change = () => {
        const first_name = (document.getElementById("first_name") as HTMLInputElement).value
        const middle_name = (document.getElementById("middle_name") as HTMLInputElement).value
        const last_name = (document.getElementById("last_name") as HTMLInputElement).value

        if (first_name.length !== 0 || middle_name.length !== 0 || last_name.length !== 0) {
            fetch("http://localhost:5000/update_profile/name", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    first_name: first_name,
                    middle_name: middle_name,
                    last_name: last_name
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
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })
            setChange(false)
        }
    }

    const submit_dob_change = () => {
        const birth_month = handleBirthMonth
        const birth_date = handleBirthDate
        const birth_year = handleBirthYear

        const age = CalculateBirthday(birth_month, parseInt(birth_date), parseInt(birth_year))

        if (age >= 18) {
            const dob_info: Record<string, string> = {
                birth_month: birth_month,
                birth_date: birth_date,
                birth_year: birth_year,
                username: username
            }

            if (warning) {
                setWarning(true)
            }

            fetch("http://localhost:5000/update_profile/DOB", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify(dob_info),
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
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
                window.location.reload()
            })
            setDOBChange(false)
        } else {
            setWarning(true)
        }
    }

    const submit_username_change = () => {
        const new_username = (document.getElementById("new_username") as HTMLInputElement).value

        if (new_username.length > 0) {
            // Update user's socket ID username key to accommodate username change.
            sessionStorage.setItem("username", new_username)
            connection.emit('update-user-socket-id', username, new_username, connection.id)

            fetch("http://localhost:5000/update_profile/username", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    new_username: new_username,
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
            }).then((data) => {
                console.log(data)
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })

            setChange(false)
        }
    }

    const submit_height_change = () => {
        const new_height_feet = (document.getElementById("new_height_feet") as HTMLInputElement).value
        const new_height_inches = (document.getElementById("new_height_inches") as HTMLInputElement).value

        if (new_height_feet.length > 0 && new_height_inches.length > 0) {
            fetch("http://localhost:5000/update_profile/height", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    new_height_feet: new_height_feet,
                    new_height_inches: new_height_inches,
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
            }).then((data) => {
                console.log(data)
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })
            setChange(false)
        }
    }

    const submit_gender_change = () => {
        const new_gender = (document.getElementById("gender-select") as HTMLInputElement).value

        if (new_gender !== profile.gender) {
            if (new_gender === "Other") {
                const other_gender = (document.getElementById("other_gender") as HTMLInputElement).value

                fetch("http://localhost:5000/update_profile/gender", {
                    method: 'PUT',
                    credentials: 'include',
                    body: JSON.stringify({
                        new_gender: other_gender,
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
                }).then((data) => {
                    console.log(data)
                    window.location.reload()
                }).catch((error) => {
                    console.log(error)
                    setError(true)
                })
            } else {
                fetch("http://localhost:5000/update_profile/gender", {
                    method: 'PUT',
                    credentials: 'include',
                    body: JSON.stringify({
                        new_gender: new_gender,
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
                }).then((data) => {
                    console.log(data)
                    window.location.reload()
                }).catch((error) => {
                    console.log(error)
                    setError(true)
                })
            }
            setChange(false)
        }
    }

    const submit_sexual_orientation_change = () => {
        const new_sexual_orientation = (document.getElementById("sexual-orientation-select") as HTMLInputElement).value

        if (new_sexual_orientation !== profile.sexual_orientation) {
            fetch("http://localhost:5000/update_profile/sexual_orientation", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    new_sexual_orientation: new_sexual_orientation,
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
            }).then((data) => {
                console.log(data)
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })
            setChange(false)
        }
    }

    const submit_relationship_status_change = () => {
        const new_relationship_status = (document.getElementById("relationship-status-select") as HTMLInputElement).value

        if (new_relationship_status !== profile.relationship_status) {
            fetch("http://localhost:5000/update_profile/relationship_status", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    new_relationship_status: new_relationship_status,
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
            }).then((data) => {
                console.log(data)
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })
            setChange(false)
        }
    }

    const submit_bio_change = () => {
        const new_bio = (document.getElementById("bio-change") as HTMLInputElement).value

        if (new_bio.length > 0 && new_bio !== profile.bio) {
            fetch("http://localhost:5000/update_profile/bio", {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({
                    new_bio: new_bio,
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
            }).then((data) => {
                console.log(data)
                window.location.reload()
            }).catch((error) => {
                console.log(error)
                setError(true)
            })
            setChange(false)
        }
    }

    const handle_bio_text = () => {
        const new_bio = (document.getElementById("bio-change") as HTMLInputElement).value
        setHandleBioText(new_bio)
    }

    const handle_name = () => {
        const first_name = (document.getElementById("first_name") as HTMLInputElement).value
        const middle_name = (document.getElementById("middle_name") as HTMLInputElement).value
        const last_name = (document.getElementById("last_name") as HTMLInputElement).value

        setHandleFirstName(first_name)
        setHandleMiddleName(middle_name)
        setHandleLastName(last_name)
    }

    const handle_dob = () => {
        const dob = (document.getElementById("date-of-birth") as HTMLInputElement).value

        setHandleDOB(dob)

        setHandleBirthMonth(NumToMonth(dob.split("-")[1]))
        setHandleBirthDate(dob.split("-")[2])
        setHandleBirthYear(dob.split("-")[0])
    }

    return (
        <div className="update-profile-container">
            {!pending ?
                <>
                    {!error ?
                        <div className="update-profile-options">
                            <Link to="/profile/options"><IoArrowBackCircleSharp size={50} color='white' style={{ marginBottom: '10px', marginTop: '10px', cursor: 'pointer' }} /></Link>
                            <div className="update-profile-header">
                                <h1>Update Profile</h1>
                            </div>
                            <div className="update-profile-option">
                                <b>Profile Picture</b>
                                <br></br>
                                <br></br>
                                <img alt="profile-pic" src={`data:image/png;base64,${sessionStorage.getItem("profile_pic")}`} id="update-profile-pic"></img>
                                <br></br>
                                <br></br>
                                {change ?
                                    <div className="change-inputs">
                                        <form encType='multipart/form-data' method='POST' action='http://localhost:5000/update_profile_pic'>
                                            <input type="file" accept='image/*' name="new-profile-pic" max={4} />
                                            <br></br>
                                            <button value="change-profile-pic" id="change-profile-pic" onClick={display_change}>Cancel</button>
                                            <br></br>
                                            <button value="change-profile-pic" id="change-profile-pic" type="submit">Submit</button>
                                            <br></br>
                                        </form>
                                    </div>
                                    :
                                    <button value="change-profile-pic" id="change-profile-pic" onClick={display_change}>Change</button>
                                }
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Name</b>
                                <p>{`${profile.name}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <input placeholder="First name" id="first_name" value={handleFirstName} onChange={handle_name}></input>
                                        <input placeholder="Middle name" id="middle_name" value={handleMiddleName} onChange={handle_name}></input>
                                        <input placeholder="Last name" id="last_name" value={handleLastName} onChange={handle_name}></input>
                                        <br></br>
                                        <button value="change-name" id="change-name" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-name" id="change-name" onClick={submit_name_change}>Submit</button>
                                        <br></br>
                                    </div>
                                    :
                                    <button value="change-name" id="change-name" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Date of Birth</b>
                                <p>{`${profile.birth_month} ${profile.birth_date}, ${profile.birth_year}`}</p>
                                {DOBChange ?
                                    <div className="change-inputs">
                                        <input type="date" id="date-of-birth" onChange={handle_dob} value={handleDOB} />
                                        <br></br>
                                        <button value="change-DOB" id="change-DOB" onClick={display_dob_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-DOB" id="change-DOB" onClick={submit_dob_change}>Submit</button>
                                        <br></br>
                                        {warning ? <p style={{ paddingTop: 50 }}><b>You have to be 18 years old to use this service.</b></p> : <></>}
                                    </div>
                                    :
                                    <button value="change-DOB" id="change-DOB" onClick={display_dob_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Username</b>
                                <p>{`${username}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <input placeholder="Enter your new username" id="new_username"></input>
                                        <br></br>
                                        <button value="change-username" id="change-username" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-username" id="change-username" onClick={submit_username_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-username" id="change-username" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Height</b>
                                <p>{`${profile.height}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <input placeholder="Feet" size={7} maxLength={6} id="new_height_feet"></input>
                                        <input placeholder="Height" size={7} maxLength={6} id="new_height_inches"></input>
                                        <br></br>
                                        <button value="change-height" id="change-height" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-height" id="change-height" onClick={submit_height_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-height" id="change-height" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Gender</b>
                                <p>{`${profile.gender}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <select id="gender-select" onChange={display_other_gender}>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                            <option value="Non-binary">Non-binary</option>
                                            <option value="Transgender Man">Transgender Man</option>
                                            <option value="Transgender Woman">Transgender Woman</option>
                                            <option value="Other">Other</option>
                                            <option value="I'd prefer not to say">I'd prefer not to say</option>
                                        </select>
                                        <br></br>
                                        {handleOtherGender === true && <input placeholder="How do you identify as?" id="other_gender"></input>}
                                        <br></br>
                                        <button value="change-gender" id="change-gender" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-gender" id="change-gender" onClick={submit_gender_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-gender" id="change-gender" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Sexual Orientation</b>
                                <p>{`${profile.sexual_orientation}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <select id="sexual-orientation-select">
                                            <option value="Heterosexual">Heterosexual</option>
                                            {(profile.gender === "Female" || profile.gender === "Non-binary" || profile.gender !== "Male") && <option value="Homosexual (Lesbian)">Homosexual (Lesbian)</option>}
                                            {(profile.gender === "Male" || profile.gender === "Non-binary" || profile.gender !== "Female") && <option value="Homosexual (Gay)">Homosexual (Gay)</option>}
                                            <option value="Bisexual">Bisexual</option>
                                            <option value="Pansexual">Pansexual</option>
                                            <option value="Queer">Queer</option>
                                            <option value="Asexual">Asexual</option>
                                            <option value="Deciding">Deciding</option>
                                            <option value="I'd prefer not to say">I'd prefer not to say</option>
                                        </select>
                                        <br></br>
                                        <button value="change-sexual-orientation" id="change-sexual-orientation" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-sexual-orientation" id="change-sexual-orientation" onClick={submit_sexual_orientation_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-sexual-orientation" id="change-sexual-orientation" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Relationship Status</b>
                                <p>{`${profile.relationship_status}`}</p>
                                {change ?
                                    <div className="change-inputs">
                                        <select id="relationship-status-select">
                                            <option value="Single">Single</option>
                                            <option value="Taken">Taken</option>
                                            <option value="Engaged">Engaged</option>
                                            <option value="Married">Married</option>
                                            <option value="Separated">Separated</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Hard to explain">Hard to explain</option>
                                            <option value="It's a secret!">It's a secret!</option>
                                        </select>
                                        <br></br>
                                        <button value="change-relationship-status" id="change-relationship-status" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-relationship-status" id="change-relationship-status" onClick={submit_relationship_status_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-relationship-status" id="change-relationship-status" onClick={display_change}>Change</button>}
                                <br></br>
                                <br></br>
                                <br></br>
                                <b>Bio</b>
                                {/* Split the bio into paragraphs in case the user decided to write it in that manner. */}
                                {profile.bio.split("\n").map((b, par_i) =>
                                    <p key={`paragraph-${par_i}`}>{`${b}`}</p>
                                )}
                                {change ?
                                    <div className="change-inputs">
                                        <textarea id="bio-change" rows={10} cols={30} value={handleBioText} onChange={(e) => {handle_bio_text(); setCurBioCharCount(e.target.value.length)}} maxLength={300}></textarea>
                                        <br></br>
                                        <span>{curBioCharCount}/300</span>
                                        <br></br>
                                        <button value="change-bio" id="change-bio" onClick={display_change}>Cancel</button>
                                        <br></br>
                                        <button value="change-bio" id="change-bio" onClick={submit_bio_change}>Submit</button>
                                    </div>
                                    :
                                    <button value="change-bio" id="change-bio" onClick={display_change}>Change</button>}
                            </div>
                        </div>
                        :
                        <h3>Error retrieving information.</h3>
                    }
                </>
                :
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <h3>Loading...</h3>
                </div>
            }
        </div>
    )
}