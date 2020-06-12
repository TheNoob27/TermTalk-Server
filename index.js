#! /usr/bin/env node
/*
	MIT License

	Copyright (c) 2020 Terminalfreaks

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

// Packages
const http = require('http').createServer()
const io = require('socket.io')(http)
const fs = require("fs")
const readline = require("readline")
const Database = require('better-sqlite3')

// Our files or utils
const Utils = require("./src/Utils.js")
const Config = require("./config.json")
// Make database directory
if (!fs.existsSync(`${__dirname}/Databases`)) fs.mkdirSync(`${__dirname}/Databases`)

// Constructors
const UserDB = new Database('./Databases/TermTalk_Users.db')
const serverCache = require('./serverCache.js')
const User = new Utils.UserHandle(UserDB)

// Sessions
const sessions = [{ "sessionID": Utils.Session.makeSessionID(), "uid": "Server", admin: true }]

// Last server message timestamp
let lastServerMessageTime = null
// Load in hardcoded commands
serverCache.addons.connectors.loadCmd()

const ci = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

io.on("connect", (socket) => {
	console.log("A user connected.")
	socket.emit("getUserData")
	socket.on("returnUserData", (data) => {
		if (data) {
			socket.join("authed")
			Utils.Server.broadcast(`${data.username}#${data.tag} has reconnected.`, io)
			if (!sessions.find(t => t.sessionID == data.sessionID)) sessions.push({ uid: data.uid, sessionID: data.sessionID, admin: Config.adminUIDs.includes(data.uid), socketID: socket.id })
		}
	})
	socket.on("login", (d) => {
		User.login(d.uid, d.password, (err, user, matched) => {
			if (err) {
				if (err.type === "userNotExists") {
					socket.emit("authResult", {
						success: false,
						method: "login",
						...err
					})
				} else {
					socket.emit("authResult", {
						success: false,
						method: "login",
						type: "serverError",
						message: "The server encountered an error. Be sure to contact the admin."
					})
					console.log(err)
				}
			}
			if (!matched) return socket.emit("authResult", {
				success: false,
				method: "login",
				type: "userCredentialsWrong",
				message: "The user's credentials are wrong."
			})

			let sessionID = Utils.Session.makeSessionID()
			sessions.push({ uid: user.uid, sessionID, admin: Config.adminUIDs.includes(user.uid), socketID: socket.id })

			socket.emit("authResult", {
				success: true,
				method: "login",
				type: "success",
				message: "Logged in successfully.",
				user: {
					uid: user.uid,
					username: user.username,
					tag: user.tag,
					sessionID
				}
			})

			socket.join("authed")
			Utils.Server.broadcast(`${user.username}#${user.tag} has connected.`, io)
		})
	})

	socket.on("register", (data) => {
		let { uid, username, tag, password } = data
		uid = uid.trim(), username = username.trim(), tag = tag.trim(), password = password.trim()

		if (!data || !["uid", "username", "tag", "password"].every((k) => k in data) || [uid, username, tag, password].some(str => str === "")) return socket.emit("authResult", {
			success: false,
			method: "register",
			type: "insufficientData",
			message: "The client did not return any or enough data."
		})
		if (tag.length > 4) return socket.emit("authResult", {
			success: false,
			method: "register",
			type: "invalidTag",
			message: "The client provided an invalid tag, or one above 4 characters."
		})

		User.register(uid, username, tag, password, (err) => {
			if (err) {
				if (err.type === "userExists") {
					socket.emit("authResult", {
						success: false,
						method: "register",
						...err
					})
					return;
				} else {
					socket.emit("authResult", {
						success: false,
						method: "register",
						type: "serverError",
						message: "The server encountered an error. Be sure to contact the admin."
					})
					console.log(err)
					return;
				}
			}

			let sessionID = Utils.Session.makeSessionID()
			sessions.push({ uid, sessionID, admin: Config.adminUIDs.includes(uid), socketID: socket.id })

			socket.emit("authResult", {
				success: true,
				method: "register",
				type: "success",
				message: "Registered successfully.",
				user: {
					uid,
					username,
					tag,
					sessionID
				}
			})
			socket.join("authed")
			Utils.Server.broadcast(`${username}#${tag} has connected.`, io)
		})
	})

	ci.on("line", (input) => {
		if (lastServerMessageTime == Date.now()) return
		lastServerMessageTime = Date.now()
		io.sockets.in("authed").emit('msg', { username: "Server", tag: "0000", msg: input, uid: "Server" })
	})

	socket.on("msg", (data) => {
		if (!data || !["uid", "username", "tag", "msg"].every((k) => k in data) || [data.uid, data.username, data.tag, data.msg].some(str => str === "")) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "insufficientData",
			message: "The client did not return any or enough data."
		})
		data.msg = data.msg.trim()
		if (!data.sessionID || !sessions.find(t => t.sessionID == data.sessionID)) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "invalidSessionID",
			message: "The client did not provide any session ID or a valid one."
		})
		let session = sessions.find(t => t.sessionID == data.sessionID && t.uid == data.uid)
		if (serverCache.addons.hardCommands.has(`${data.msg.trim().replace("/", "")}`) && data.msg.trim().charAt(0) == "/") {
			let cmd = data.msg.trim().replace("/", "")
			let command = null
			if (serverCache.addons.hardCommands.has(cmd)) command = serverCache.addons.hardCommands.get(cmd)
			if (command !== null) {
				if(command.data.permission == "admin" && !session.admin) return Utils.Server.send("You don't have permission to use this.", io, session.socketID)
				command.run({ Utils: Utils, io: io, session: session, cache: serverCache}, data, data.msg.slice(1).trim().split(/ +/g))
			}
		}
		if (data.uid === "Server") return;

		data.msg = Utils.Session.sanitizeInputTags(data.msg)
		console.log(`${data.username}#${data.tag} ➤ ${data.msg}`)
		if (serverCache.addons.hardCommands.has(`${data.msg.trim().replace("/", "")}`) && data.msg.trim().charAt(0) == "/") return;
		io.sockets.in("authed").emit('msg', { msg: data.msg, username: data.username, tag: data.tag, uid: data.uid })
	})

	socket.on("disconnecting", () => {
		socket.removeAllListeners()
		let sessionIndex = sessions.findIndex(t => t.socketID == socket.id)
		if (sessionIndex == -1) return console.log("A user has disconnected.")
		let session = sessions.splice(sessionIndex, 1)[0]
		User.getUserByUID(session.uid, (err, d) => {
			if (err) return;
			console.log(`${d.username}#${d.tag} has disconnected.`)
			if (session) {
				Utils.Server.broadcast(`${d.username}#${d.tag} has disconnected.`, io)
			}
		})
	})

	process.on("beforeExit", () => {
		io.sockets.in("authed").emit("disconnect")
	})
})

ci.on("SIGINT", () => {
	process.exit(0)
})

http.listen(Config.port, () => {
	const table = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()
	if (!table["count(*)"]) {
		UserDB.prepare("CREATE TABLE users (id INTEGER PRIMARY KEY, uid TEXT, username TEXT, tag TEXT, passwordHash TEXT);").run();
		UserDB.prepare("CREATE UNIQUE INDEX idx_user_id ON users (id);").run()
		UserDB.pragma("synchronous = 1")
		UserDB.pragma("journal_mode = wal")
		console.log("Created SQLite users database and table.")
	}

	console.log(`Server online on port ${Config.port}.`)
})

