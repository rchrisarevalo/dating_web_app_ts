import { Spinner } from "react-bootstrap";

export const ProfilePicture = () => {
    const profilePic = sessionStorage.getItem("profile_pic")
    return (
        <>
            {profilePic !== null ? <img alt="profile-pic" src={`data:image/png;base64,${profilePic}`} id="user-profile-pic"></img> : <Spinner size={"sm"}/>}
        </>
    )
}