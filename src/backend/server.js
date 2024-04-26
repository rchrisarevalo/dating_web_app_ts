// Use 'express' library to be able to generate express app instance.
import express from 'express'
import cors from 'cors'
import * as http from 'node:http'
import { Server } from 'socket.io'
import NodeCache from 'node-cache'
import * as dot from 'dotenv'
import pg from 'pg'
import fs from 'fs'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'

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
        host: ['http://localhost:5173/', 'http://localhost:5000'],
        maxAge: 3600
    }
})

// To access environment variables to allow for connection
// to database.
dot.config({ path: 'secret.env' })
// ==================================================

var socket_id_users = {}

const { Client } = pg
const { readFileSync } = fs
const { verify } = jwt

const createConnection = async () => {
    const client = new Client(
    {
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        ssl: {
            rejectUnauthorized: true, 
            ca: readFileSync("ca.pem").toString()
        }
    })

    return client
}

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

    socket.on('receive-update-profile-request', () => {
        cache.flushAll()
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
        // Clear all of the cache when the user
        // disconnects from the socket.
        cache.flushAll()
        console.log("Disconnected!")
    })
})
// ==================================================

server.use(cors(
    { 
        origin: ['http://localhost:5173', 'http://localhost:5000'], 
        credentials: true 
    }
))
server.use(express.json())
server.use(cookieParser())

const protected_route = express.Router()

protected_route.use(async (req, res, next) => {
    verify(req.cookies.user_session, process.env.SK_KEY, (error) => {
        if (error) {
            res.status(401).send({"message": "Token not verified!"})
        }
        // Connect to the database.
        const db = new Client(
        {
            user: process.env.DB_USER,
            password: process.env.DB_PWD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_DATABASE,
            ssl: {
                rejectUnauthorized: true, 
                ca: readFileSync("ca.pem").toString()
            }
        })

        db.connect()

        // Retrieve stored token from the database.
        const statement = "SELECT * FROM retrieve_session($1, $2)"
        const params = [req.cookies.username, req.cookies.user_session]
        const db_res = db.query(statement, params)
        
        db_res.then((r) => {
            const retrieved_token = r.rows
            // Edge case to ensure that the list is not empty and to
            // prevent an error from occurring.
            if (retrieved_token) {
                // Retrieve the token from the list
                // in its string form.
                const db_token = retrieved_token[0]["session"]

                // Decode the token.
                //
                // If successful, move to the next request to indicate that
                // the session has been verified.
                //
                // Otherwise, throw an exception.
                verify(db_token, process.env.SK_KEY, (error, payload) => {
                    const payload_issuer = payload.iss
                    const origin = typeof(req.headers.origin) !== "undefined" ? (req.headers.origin).concat("/") : "undefined"
                    db.end()

                    if (error) {
                        res.status(498).send({"message": "Invalid token!"})
                    } else {
                        // Edge case to ensure that the issuer of the JWT token is the same
                        // as the origin of the server request, the client, to further
                        // protect backend endpoints from being accessed through unauthorized
                        // means.
                        console.log("Token verified!")
                        if (payload_issuer == origin) {
                            next()
                        } else {
                            res.status(403).send({"message": "You are not allowed to access this endpoint."})
                        }
                    }
                })
            }
            // If there is nothing in the list, then throw an exception,
            // thus invalidating the session.
            else {
                res.status(498).send({"message": "Invalid token!"})
            }
        }).catch((error) => {
            console.log(error)
        })
    })
})

const cache = new NodeCache()

const profileCache = (req, res, next) => {
    const visiting_user_username = req.params.user
    const current_url = `${req.cookies.username}-${visiting_user_username}-${req.cookies.user_session}`

    if (cache.get(current_url)) {
        res.status(200).send(cache.get(current_url))
    } else {
        next()
    }
}

const recentMessageCache = (req, res, next) => {
    const username = req.cookies.username
    const recent_msg_cache_key = `${username}-recent-messages-${req.cookies.session}`

    if (cache.get(recent_msg_cache_key))
        res.status(200).send(cache.get(recent_msg_cache_key))
    else
    {
        next()
    }
}

server.get('/', async (req, res) => {
    res.status(200).send({"message": "This server is working!"})
})

protected_route.post('/profile/:user', profileCache, async (req, res) => {
    const db = await createConnection()
    
    try {
        const username = req.params.user

        const statement = "SELECT * FROM Profile($1)"
        const params = [username]
        await db.connect()

        let db_res = await db.query(statement, params)

        // Turn the user's profile image, which was retrieved as a Buffer data type,
        // into a URI that is readable by the client so that it can be displayed.
        db_res.rows.map(result => result.uri = Buffer.from(result.uri).toString())

        // Set the cache so that when the user visits the profile once more within every
        // 5 minutes, the profile is immediately ready to be sent to the client.
        cache.set(`${req.cookies.username}-${req.params.user}-${req.cookies.user_session}`, db_res.rows[0], 300)
        
        // Send the rows retrieved from the database to the client
        // to display the user's profile.        
        res.status(200).send(db_res.rows[0])
    } catch {
        res.status(500).send({"message": "Failed to retrieve profile data!"})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.get('/privacy/check_recommendation_settings', async (req, res) => {
    const username = req.cookies.username
    const db = await createConnection()

    try {
        const statement = "SELECT used, use_so_filter FROM Recommendation_Settings WHERE username=$1"
        const params = [username]
        await db.connect()

        const db_res = await db.query(statement, params)
        
        res.status(200).send(db_res.rows[0])
    } catch {
        res.status(500).send({"message": "Failed to retrieve recommendation settings for user."})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.get('/retrieve_search_history', async (req, res) => {
    const username = req.cookies.username
    const db = await createConnection()

    console.log("In this endpoint!")

    try {
        const statement = `
            SELECT search_term FROM Search_History WHERE username=$1 ORDER BY date_and_time DESC LIMIT 10
        `
        const params = [username]
        await db.connect()

        const db_res = await db.query(statement, params)

        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Failed to retrieve search history. Try again."})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.get("/get_user_routes", async (req, res) => {
    const username = req.cookies.username
    const db = await createConnection()

    try {
        const statement = "SELECT * FROM retrieve_users($1)"
        const params = [username]
        await db.connect()
        const db_res = await db.query(statement, params)

        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Failed to retrieve user routes! Try again!"})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.get("/check_messaged_users", recentMessageCache, async (req, res) => {
    const username = req.cookies.username
    const db = await createConnection()

    try {
        const statement = "SELECT * FROM Recent_Messages($1)"
        const params = [username]
        await db.connect()
        let db_res = await db.query(statement, params)
        db_res.rows.map(result => result.uri = Buffer.from(result.uri).toString())
        cache.set(`${username}-recent-messages-${req.cookies.session}`, db_res.rows, 300)
        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Failed to retrieve messaged users."})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.post('/retrieve_messages', async (req, res) => {
    const data = req.body
    const sender = req.cookies.username
    const db = await createConnection()

    try {
        const statement = `
            SELECT message, message_from FROM Messages WHERE (message_from=$1 AND message_to=$2) 
            OR (message_from=$3 AND message_to=$4) ORDER BY date_and_time ASC
        `
        const params = [sender, data.receiver, data.receiver, sender]
        await db.connect()

        const db_res = await db.query(statement, params)

        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Failed to retrieve messages."})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.get("/retrieve_notification_count", async (req, res) => {
    const username = req.query.username
    const db = await createConnection()

    if (username) {
        try {
            const statement = "SELECT notification_counter FROM Notifications WHERE username=$1"
            const params = [username]
            await db.connect()

            const db_res = await db.query(statement, params)

            res.status(200).send(db_res.rows[0])
        } catch {
            res.status(500).send({"message": "Failed to retrieve notification count for user!"})
        } finally {
            setTimeout(async () => {
                await db.end()
            }, 25)
        }
    } else {
        res.status(400).send({"message": "Missing username for query parameter."})
    }
})

protected_route.get("/retrieve_blocked_users", async (req, res) => {
    const username = req.cookies.username
    const db = await createConnection()

    try {
        const statement = `
            SELECT B.blockee, P.first_name, P2.uri 
            FROM Blocked B, Profiles P, Photos P2 WHERE B.blocker=$1 
            AND P.username=B.blockee AND B.blockee=P2.username 
            ORDER BY P.last_name, P.first_name
        `
        const params = [username]
        await db.connect()

        let db_res = await db.query(statement, params)
        db_res.rows.map(result => result.uri = Buffer.from(result.uri).toString())

        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Failed to retrieve blocked users."})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

protected_route.post('/retrieve_block_status', async (req, res) => {
    const data = req.body
    const db = await createConnection()

    try {
        const statement = `
            SELECT B.blockee, P.uri from Blocked B, Photos P 
            WHERE (B.blocker=$1 AND B.blockee=$2) 
            OR (B.blocker=$3 AND B.blockee=$4) 
            AND B.blockee=P.username
        `
        const params = [data.logged_in_user, data.profile_user, data.profile_user, data.logged_in_user]
        await db.connect()

        const db_res = await db.query(statement, params)

        res.status(200).send(db_res.rows)
    } catch {
        res.status(500).send({"message": "Could not retrieve information!"})
    } finally {
        setTimeout(async () => {
            await db.end()
        }, 25)
    }
})

// Configure the protected routes.
server.use(protected_route)
httpServer.listen(port, () => {
    console.log("This server is listening at port %d!", port)
})