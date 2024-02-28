// Use 'express' library to be able to generate express app instance.
import express from 'express'
import cors from 'cors'
import * as http from 'node:http'
import { Server } from 'socket.io'
import * as dot from 'dotenv'

// Initialize server with express() function, which
// will create the application.
var server = express()
var port = 4000

// Create Node.js HTTP server using the Express variable (in
// this case, 'server') to do so.
var httpServer = http.createServer(server)

// When creating the socket server, explicitly state
// the host you are going to use it on, even
// if the 'cors' library is used.
var socket_server = new Server(httpServer, {
    cors: {
        host: 'http://localhost:5173/',
    }
})

// To access environment variables to allow for connection
// to database.
dot.config({ path: 'secret.env' })
// ==================================================

var socket_id_users = {}

// ==================================================
// Create socket server connection so that client
// can emit messages to it.
socket_server.on('connection', (socket) => {
    console.log("Connected!")

    // Retrieve message from client (sender).
    socket.on('sender-message', (sender_msg, username) => {
        // Emit message to recipient.
        socket.to(socket_id_users[username]).emit('recipient-message', sender_msg)
    })

    // Emit notification that user is currently typing in their message.
    socket.on('user-typing-msg', (username, message) => {
        socket.to(socket_id_users[username]).emit('user-is-typing-msg', username, message)
    })

    // Store user's socket ID so that it can be used when
    // sending messages, notifications, etc.
    socket.on('store-user-socket-id', (username, id) => {
        if (username !== null) {
            socket_id_users[username] = id
        }
    })

    // Update user's socket ID after they have changed their username.
    socket.on('update-user-socket-id', (old_username, new_username, id) => {
        delete socket_id_users[old_username]
        socket_id_users[new_username] = id
    })

    // Remove user's socket ID after they have logged out.
    socket.on('remove-user-socket-id', (username) => {
        delete socket_id_users[username]
    })

    // Update user's notification counter
    socket.on('update-notification-counter', (username) => {
        socket.to(socket_id_users[username]).emit('get-updated-notification-counter', username)
    })

    // Print message after disconnecting from server.
    socket.on('disconnect', () => {
        console.log("Disconnected!")
    })
})
// ==================================================

server.use(cors({ origin: 'http://localhost:5173', credentials: true }))
server.use(express.json())

server.get('/', (req, res) => {
    try {
        res.status(200).send({ "status": "This server is working!" })
    } catch {
        res.status(429).send({ "status": "You have been rate limited! Sucks to be you!" })
    }
})

server.post("/logout", async (req, res) => {
    setTimeout(() => { res.status(403).redirect("http://localhost:5173") }, 1000)
})

httpServer.listen(port, () => {
    console.log("This server is listening at port %d!", port)
})