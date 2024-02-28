// This is a similar implementation from the documentation of Socket.IO,
// which is licensed under the MIT License.
//
// Link to original code: https://socket.io/how-to/use-with-react

import { io } from "socket.io-client";

export const socket_conn = io("http://localhost:4000", { autoConnect: false })