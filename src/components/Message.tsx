import React from "react";
import { MessageLog } from "../types/types.config";

interface MessageProps {
    message: MessageLog,
    username: string,
    retrieve_receive_user_from_path: string,
    receiver_name: string,
    curDate: string,
    dateSet: Record<string, number>,
    index: number
}

export const Message: React.FC<MessageProps> = ({
    message, 
    username, 
    retrieve_receive_user_from_path, 
    receiver_name,
    curDate,
    dateSet,
    index
}) => {

    return (
        <>
            {dateSet[message.date_sent] == index && <div className="chat-date-separator">{curDate}<hr></hr></div>}
            <div className="chat-message">
                {message.message_from === username &&
                    <div className="chat-box">
                        <p id="sender-username">{`You`}</p>
                        <div className="sender-text">
                            <p>{message.message}</p>
                        </div>
                    </div>
                }
                {message.message_from === retrieve_receive_user_from_path &&
                    <div className="chat-box">
                        <p id="recipient-username">{`${receiver_name}`}</p>
                        <div className="recipient-text">
                            <p>{message.message}</p>
                        </div>
                    </div>
                }
            </div>
        </>
    )
}