import { useEffect, useState } from 'react'
import { Wrapper } from "../components/Wrapper"
import { useFetchChatReqs } from "../hooks/useChatReq"
import { ChatReq } from "../types/types.config"

import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { socket_conn } from '../functions/SocketConn';

export const ViewChatReqs = () => {

    const { chat_reqs, chat_reqs_pending, chat_reqs_error } = useFetchChatReqs("http://localhost:4000/retrieve_chat_requests", socket_conn)

    const [chatReqs, setChatReqs] = useState<ChatReq[]>([])

    useEffect(() => {
        if (!chat_reqs_pending && !chat_reqs_error) {
            setChatReqs(chat_reqs)
        }
    }, [chat_reqs, chat_reqs_error, chat_reqs_pending])

    const approveChatReq = async (username: string) => {
        const res = await fetch(`http://localhost:5000/privacy/chat_request_response?r=approve`, {
            method: 'PUT',
            credentials: 'include',
            body: JSON.stringify({
                requestor: username
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (res.ok) {
            const data = await res.json()
            setChatReqs(data)
            socket_conn.emit('chat-request', username)
        } else {
            console.log(res.status)
        }
    }

    const denyChatReq = async (username: string) => {
        const res = await fetch(`http://localhost:5000/privacy/chat_request_response?r=deny`, {
            method: 'PUT',
            credentials: 'include',
            body: JSON.stringify({
                requestor: username
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (res.ok) {
            const data = await res.json()
            setChatReqs(data)
            socket_conn.emit('chat-request', username)
        } else {
            console.log(res.status)
        }
    }

    return (
        <Wrapper>
            <h1>Chat Requests</h1>
            <h5>This is a list of chat requests that you made or were sent to you.</h5>
            <h5>Feel free to approve or deny them, as well as withdraw your chat request if you sent one.</h5>
            {!chat_reqs_pending ?
                !chat_reqs_error ?
                    chatReqs.length !== 0 ?
                        chatReqs.map((req: ChatReq, index: number) =>
                            <span className="chat-req-wrapper">
                                <span className="chat-req-row">
                                    <span className="chat-req-col">
                                        <img src={`data:image/png;base64,${req.uri}`} alt={`profile-img-${index}`} />
                                    </span>
                                    <span className="chat-req-col">
                                        <p><b>{req.first_name}</b></p>
                                        <p>{req.request_made}</p>
                                    </span>
                                </span>
                                <span className="chat-req-row">
                                    <span className="chat-req-col">
                                        <button id="approve-btn" onClick={() => approveChatReq(req.username)}><IoCheckmark /></button>
                                    </span>
                                    <span className="chat-req-col">
                                        <button id="deny-btn" onClick={() => denyChatReq(req.username)}><IoCloseOutline /></button>
                                    </span>
                                </span>
                            </span>
                        )
                        :
                        <p style={{display: 'flex', flexDirection: 'column', height: '40vh', justifyContent: 'center', alignItems: 'center', fontWeight: '300', fontSize: '18px'}}>
                            There are no pending chat requests for you to approve or deny at this point.
                        </p>
                    :
                    <h4 style={{display: 'flex', flexDirection: 'column', height: '40vh', justifyContent: 'center', alignItems: 'center', fontWeight: '300', fontSize: '18px'}}>Failed to load chat requests.</h4>
                :
                <h4 style={{display: 'flex', flexDirection: 'column', height: '40vh', justifyContent: 'center', alignItems: 'center', fontWeight: '300', fontSize: '18px'}}>Loading...</h4>
            }
        </Wrapper>
    )
}