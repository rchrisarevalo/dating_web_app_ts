import { useContext } from "react";
import { Loading } from "../components/Loading";
import { CurrentUserProfileContext } from "../components/Contexts";
import MediaQuery from "react-responsive";

export const Profile = () => {
  const profileContext = useContext(CurrentUserProfileContext);

  if (!profileContext) {
    throw new Error("The context failed to be recognized!");
  }

  const { profile_page, profile_page_error, profile_page_pending } =
    profileContext;

  return (
    <div className="profile-container">
      {!profile_page_pending ? (
        <>
          {!profile_page_error ? (
            <div className="profile-page-section">
              <div className="profile-page-pic">
                <img
                  src={`data:image/png;base64,${profile_page.uri}`}
                  alt="profile-pic"
                ></img>
              </div>
              <div className="profile-page-bio">
                <h1>{`${profile_page.name}, ${profile_page.age}`}</h1>
                <p>
                  {/* Split the interests section into paragraphs if the user has entered it that way. */}
                  {profile_page.interests.split("\n").map((paragraph, i) => (
                    <p key={`profile-interests-paragraph-${i}`}>
                      {paragraph}
                      <br></br>
                    </p>
                  ))}
                </p>
              </div>
              <div className="profile-page-details">
                <div className="profile-page-details-row">
                  <div className="profile-page-details-col">
                    <h4>Height</h4>
                    <h5>{`${profile_page.height}`}</h5>
                    <h4>Sexual Orientation</h4>
                    <h5>{`${profile_page.sexual_orientation}`}</h5>
                  </div>
                  <div className="profile-page-details-col">
                    <h4>Relationship Status</h4>
                    <h5>{`${profile_page.relationship_status}`}</h5>
                  </div>
                </div>
              </div>
              <MediaQuery minWidth={1024}>
                <br></br>
                <br></br>
                <br></br>
              </MediaQuery>
            </div>
          ) : (
            <Loading error={profile_page_error} />
          )}
        </>
      ) : (
        <Loading error={false} />
      )}
    </div>
  );
};
