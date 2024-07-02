import { useState, useEffect } from "react";
import { MessageLog } from "../types/types.config";

export const useFetchChatDates = (messages: MessageLog[], 
                                  error: boolean, 
                                  pending: boolean,
                                  message_sending: boolean) => {
    // Create a state variable to store the index value that corresponds
    // to the conversation starter date, which is the key.
    const [chatDates] = useState<Record<string, number>>({})

    useEffect(() => {
        // Ensure that there are messages and that the
        // request status is no longer pending and does
        // not return an error to avoid bugs.
        if (messages.length !== 0 && !error && !pending && !message_sending) {
            // Go through every message.
            messages.map((msg, i) => {
                // If the chatDates object does not have the key
                // representing the date in which the conversation
                // started, then include it.
                if (!Object.keys(chatDates).includes(msg.date_sent)) {
                    chatDates[msg.date_sent] = i
                }
            })
        }
    }, [messages, error, pending, message_sending])

    return { chat_dates: chatDates }
}