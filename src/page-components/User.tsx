import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { UserNav } from "../components/Nav";
import { Loading } from "../components/Loading";
import { MobileFooter } from "../components/MobileFooter";

import { useLogVisit } from "../hooks/useLogVisit";
import { useFetchChatReqStatus, useSendChatReq } from "../hooks/useChatReq";
import { Profile, CurrentRequestStatus } from "../types/types.config";

import { IoTrashOutline } from "react-icons/io5";
import { Spinner } from "react-bootstrap";
import { socket_conn } from "../functions/SocketConn";

interface UserProps {
  username: string;
}

export const User = (props: UserProps) => {
  // Store logged in user's username to use when checking to see if this user was blocked
  // by them.
  const { username } = props;

  const [profile, setProfile] = useState<Profile>({
    username: "",
    name: "",
    age: 0,
    height: "",
    interests: "",
    sexual_orientation: "",
    relationship_status: "",
    uri: "",
  });

  const [request, setRequest] = useState<CurrentRequestStatus>({
    sent: false,
    made: false,
    type: "",
    approved: false,
    is_requestor: false,
  });

  // State variable that stores user's block status (i.e., false = user not blocked, true = user is blocked).
  const [blocked, setBlocked] = useState(false);

  const currentRoute = useLocation();
  const retrieve_username_from_path = currentRoute.pathname.split("/user/")[1];

  // State variable that is used if error is detected.
  const [error, setError] = useState(false);

  // State variable that handles pending status.
  const [pending, setPending] = useState(true);

  const { chat_req_loading, chat_req_error } = useFetchChatReqStatus(
    retrieve_username_from_path,
    setRequest,
    socket_conn
  );

  // Custom hook that sends a chat request to the user
  // that the logged in user is visiting.
  useSendChatReq(retrieve_username_from_path, request, setRequest);

  const approveChatReq = async () => {
    const res = await fetch(
      `http://localhost:5000/privacy/chat_request_response?r=approve`,
      {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          requestor: retrieve_username_from_path,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      setRequest({
        ...request,
        approved: true,
        sent: true,
      });
      socket_conn.emit("chat-request", username);
    }
  };

  const deleteChatReq = async () => {
    const res = await fetch(
      `http://localhost:5000/privacy/chat_request_response?r=deny`,
      {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          requestor: retrieve_username_from_path,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      setRequest({
        ...request,
        approved: false,
        sent: false,
      });
      socket_conn.emit("chat-request", username);
    }
  };

  // useEffect hook will use the user's username to retrieve basic
  // profile information, such as their name, bio, age, etc.
  useEffect(() => {
    const retrieveUserProfile = async () => {
      const res = await fetch(
        `http://localhost:4000/profile/${retrieve_username_from_path}`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            username: retrieve_username_from_path,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data: Profile = await res.json();
        console.log(data);
        setPending(false);
        setProfile(data);
      } else {
        setPending(false);
        setError(true);
      }
    };
    retrieveUserProfile();
  }, [retrieve_username_from_path, request.approved]);

  // Custom hook that increments the number of times
  // the logged in user visits the user.
  useLogVisit(retrieve_username_from_path);

  // Retrieve user's blocked status.
  useEffect(() => {
    const retrieveBlockStatus = async () => {
      const res: Response = await fetch(
        "http://localhost:4000/retrieve_block_status",
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            logged_in_user: username,
            profile_user: retrieve_username_from_path,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data: string[] = await res.json();

        if (data.length !== 0) {
          setBlocked(true);
        } else {
          // Do nothing...
        }
      } else {
        setError(true);
      }
    };
    retrieveBlockStatus();
  }, [username, retrieve_username_from_path]);

  return (
    <div className="profile-container">
      <UserNav
        current_user_username={retrieve_username_from_path}
        logged_in_user_username={username}
        blocked={blocked}
        chat_request_approved={request.approved}
      />
      {!pending ? (
        <>
          {!error ? (
            <div className="profile-page-section">
              <div className="profile-page-pic">
                <img
                  src={`data:image/png;base64,${profile.uri}`}
                  alt="profile-pic"
                ></img>
              </div>
              <div className="profile-page-bio">
                {!chat_req_loading ? (
                  !chat_req_error ? (
                    <>
                      {request.sent && !request.approved && (
                        <>
                          {request.is_requestor ? (
                            <span id="requestor-span">
                              <button id="requestor-btn" disabled>
                                Chat Request Pending
                              </button>
                              <IoTrashOutline
                                onClick={() =>
                                  setRequest({
                                    ...request,
                                    made: true,
                                    type: "remove",
                                  })
                                }
                                style={{
                                  cursor: "pointer",
                                  color: "rgb(205, 44, 226)",
                                  marginLeft: "10px",
                                }}
                                size={20}
                              />
                            </span>
                          ) : (
                            <span id="requestee-span">
                              <button
                                id="requestee-btn"
                                onClick={approveChatReq}
                              >
                                Approve Request
                              </button>
                              <button
                                id="requestee-btn"
                                onClick={deleteChatReq}
                              >
                                Deny Request
                              </button>
                            </span>
                          )}
                        </>
                      )}
                      {!request.sent && !request.approved && (
                        <button
                          onClick={() =>
                            setRequest({ ...request, made: true, type: "send" })
                          }
                          id="request-btn"
                        >
                          Send Chat Request
                        </button>
                      )}
                      {request.sent && request.approved && (
                        <button
                          onClick={() =>
                            setRequest({
                              ...request,
                              made: true,
                              type: "remove",
                            })
                          }
                          id="unfollow-btn"
                        >
                          Unfollow
                        </button>
                      )}
                    </>
                  ) : (
                    <p>Error! Try again!</p>
                  )
                ) : (
                  <Spinner animation="border" />
                )}
              </div>
              <div className="profile-page-bio">
                <h1>{`${profile.name}, ${profile.age}`}</h1>
                {profile.interests.split("\n").map((paragraph, i) => (
                  <p key={`profile-interests-paragraph-${i}`}>
                    {paragraph}
                    <br></br>
                  </p>
                ))}
              </div>
              <div className="profile-page-details">
                {request.sent && request.approved ? (
                  <div className="profile-page-details-row">
                    {typeof profile.height == "undefined" ||
                    typeof profile.sexual_orientation == "undefined" ||
                    typeof profile.sexual_orientation == "undefined" ? (
                      <>
                        <Spinner animation="border" />
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <i>
                      To know more about {profile.name}, send them a chat
                      request!
                    </i>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Loading error={error} />
          )}
        </>
      ) : (
        <Loading error={error} />
      )}
      <MobileFooter
        username={username}
        blocked={blocked}
        chat_request_approved={request.approved}
      />
    </div>
  );
};
