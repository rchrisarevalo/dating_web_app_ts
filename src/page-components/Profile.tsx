import { Loading } from '../components/Loading'
import { CurrentProfile } from '../types/types.config'

interface ProfileProps
{
    profile: CurrentProfile,
    pending: boolean,
    error: boolean
}

export const Profile = (props: ProfileProps) => {

    const { profile, pending, error } = props;

    return (
        <div className="profile-container">
            {!pending ?
                <>
                    {!error ? 
                        <div className="profile-page-section">
                            <div className="profile-page-pic">
                                <img src={`data:image/png;base64,${profile.profile_pic}`} alt="profile-pic"></img>
                            </div>
                            <div className="profile-page-bio">
                                <h1>{`${profile.name}, ${profile.age}`}</h1>
                                <p>
                                    {/* Split the interests section into paragraphs if the user has entered it that way. */}
                                    {profile.interests.split("\n").map((paragraph, i) => 
                                        <p key={`profile-interests-paragraph-${i}`}>
                                            {paragraph}
                                            <br></br>
                                        </p>
                                    )}
                                </p>
                            </div>
                            <div className="profile-page-details">
                                <div className="profile-page-details-row">
                                    <div className="profile-page-details-col">
                                        <h4>Height</h4>
                                        <h5>{`${profile.height}`}</h5>
                                        <h4>Sexual Orientation</h4>
                                        <h5>{`${profile.sexual_orientation}`}</h5>
                                    </div>
                                    <div className="profile-page-details-col">
                                        <h4>Relationship Status</h4>
                                        <h5>{`${profile.relationship_status}`}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        <Loading error={error}/>
                    }
                </>
                :
                <Loading error={false} />
            }
        </div>
    )
}