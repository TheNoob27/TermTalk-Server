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
const Database = require('better-sqlite3')
const fs = require("fs")
const readline = require("readline")
const http = require('http')

// Our files or utils
const Config = require("./config.json")
const Utils = require("./src/Utils.js")
const serverCache = require("./src/serverCache.js")

// Make database directory
if (!fs.existsSync(`${__dirname}/Databases`)) fs.mkdirSync(`${__dirname}/Databases`)

// Constructors
const UserDB = new Database('./Databases/TermTalk_Users.db')
const User = new Utils.UserHandle(UserDB)

// Sessions
const sessions = [{ "sessionID": Utils.Session.makeSessionID(), "uid": "Server", admin: true }]

// Server
const server = http.createServer((req, res) => {
	// if(!Config.publicServer || ["0.0.0.0", "localhost", "127.0.0.1"].includes(Config.publicIP)) return res.writeHead(400) // Was thinking maybe pinging should be all servers so I commented this out
	if (req.url == "/ping") {
		let toWrite = JSON.stringify({
			members: Utils.Server.getMemberList(sessions, User).length,
			maxMembers: Config.maxSlots,
			name: Config.serverName,
			port: Config.port,
			ip: Config.publicIP
		})
		res.writeHead(200, { "Content-Type": "application/json" })
		res.end(toWrite)
	}
})
const io = require('socket.io')(server)

if (Config.publicServer) {
	if (["0.0.0.0", "localhost", "127.0.0.1", ""].includes(Config.publicIP)) console.log("Unable to publicly list server because ip is not public.")
	const options = {
		hostname: "termtalkservers.is-just-a.dev",
		port: 7680,
		path: "/addserver",
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		}
	}

	const postData = JSON.stringify({
		ip: Config.publicIP,
		port: Config.port
	})

	const req = http.request(options, res => {
		const status = res.statusCode
		let raw = ""

		res.on("data", (chunk) => raw += chunk)

		res.on("end", () => {
			if (res.statusCode === 200) {
				let data = JSON.parse(raw)

				Config.key = data.key
				fs.writeFileSync("./config.json", JSON.stringify(Config, null, 4))
				console.log("Server added to the server list!")
			} else {
				if (raw !== "Server already listed.") return console.log(raw)
			}
		})
	})

	req.write(postData)
	req.end()
} else if (Config.key) {
	if (["0.0.0.0", "localhost", "127.0.0.1", ""].includes(Config.publicIP)) console.log("Unable to remove publicly listed server because ip is not public.")
	const options = {
		hostname: "termtalkservers.is-just-a.dev",
		port: 7680,
		path: "/removeserver",
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		}
	}

	const postData = JSON.stringify({
		ip: Config.publicIP,
		port: Config.port,
		key: Config.key
	})

	const req = http.request(options, res => {
		const status = res.statusCode
		let raw = ""

		res.on("data", (chunk) => raw += chunk)

		res.on("end", () => {
			if (res.statusCode === 200) {
				console.log(raw)
				delete Config.key
				fs.writeFileSync("./config.json", JSON.stringify(Config, null, 4))
			} else {
				if (raw !== "Server not listed.") return console.log(raw)
			}
		})
	})

	req.write(postData)
	req.end()
}


// Last server message timestamp
let lastServerMessageTime = null

// Load in hardcoded commands
serverCache.addons.connectors.loadCmd()

const ci = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

io.on("connect", (socket) => {
	if (Object.keys(io.sockets.connected).length > Config.maxSlots) {
		socket.emit("methodResult", {
			success: false,
			method: "connect",
			type: "maxSlots",
			message: "The server is currently full. Try again later."
		})
		socket.disconnect(true)
		return;
	}

	console.log("A user has connected.")
	socket.emit("methodResult", {
		success: true,
		method: "connect",
		type: "success",
		message: "Successfully connected."
	})

	socket.emit("getUserData")
	socket.on("returnUserData", (data) => {
		if (data) {
			if (User.isBanned(data.uid)) return socket.emit("authResult", {
				success: false,
				method: "reconnect",
				type: "userBanned",
				message: "You are banned."
			})
			socket.join("authed")
			Utils.Server.broadcast(`${data.username}#${data.tag} has reconnected.`, io)
			if (!sessions.find(t => t.sessionID == data.sessionID)) sessions.push({ uid: data.uid, sessionID: data.sessionID, admin: Config.adminUIDs.includes(data.uid), socketID: socket.id })
			io.sockets.in("authed").emit("method", {
				method: "userConnect",
				type: "serverRequest",
				user: `${data.username}#${data.tag}`
			})
			let memberList
			try {
				memberList = Utils.Server.getMemberList(sessions, User)
			} catch (e) {
				socket.emit("methodResult", {
					success: false,
					method: "getMemberList",
					type: "serverError",
					message: "The server encountered an error. Be sure to contact the admin."
				})
				return
			}
			socket.emit("methodResult", {
				success: true,
				method: "getMemberList",
				type: "success",
				message: "Successfully received the member list.",
				memberList
			})
		}
	})
	socket.on("login", (d) => {
		if (Utils.Server.userIsConnected(d.uid, sessions)) return socket.emit("authResult", {
			success: false,
			method: "login",
			type: "userAlreadyConnected",
			message: "You are already connected."
		})
		if (User.isBanned(d.uid)) return socket.emit("authResult", {
			success: false,
			method: "login",
			type: "userBanned",
			message: "You are banned."
		})
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
			sessions.push({ uid: user.uid, sessionID, admin: Config.adminUIDs.includes(user.uid), socketID: socket.id, id: user.id })

			socket.emit("authResult", {
				success: true,
				method: "login",
				type: "success",
				message: "Logged in successfully.",
				user: {
					id: user.id,
					uid: user.uid,
					username: user.username,
					tag: user.tag,
					sessionID
				}
			})

			socket.join("authed")
			if (Config.saveLoadHistory) serverCache.addons.connectors.sendHistory(serverCache, io, socket.id)
			Utils.Server.broadcast(`${user.username}#${user.tag} has connected.`, io)
			io.sockets.in("authed").emit("method", {
				method: "userConnect",
				user: `${user.username}#${user.tag}`,
				type: "serverRequest"
			})
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

		User.register(uid, username, tag, password, (err, id) => {
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
			sessions.push({ uid, sessionID, admin: Config.adminUIDs.includes(uid), socketID: socket.id, id })

			socket.emit("authResult", {
				success: true,
				method: "register",
				type: "success",
				message: "Registered successfully.",
				user: {
					id,
					uid,
					username,
					tag,
					sessionID
				}
			})
			socket.join("authed")
			Utils.Server.broadcast(`${username}#${tag} has connected.`, io)
			if (Config.saveLoadHistory) serverCache.addons.connectors.sendHistory(serverCache, io, socket.id)
			io.sockets.in("authed").emit("method", {
				method: "userConnect",
				type: "serverRequest",
				user: `${username}#${tag}`
			})
		})
	})

	ci.on("line", (input) => {
		if (lastServerMessageTime == Date.now()) return
		lastServerMessageTime = Date.now()
		io.sockets.in("authed").emit("msg", { username: "Server", tag: "0000", msg: input, uid: "Server" })
	})

	socket.on("msg", (data) => {
		if (!data || !["id", "uid", "username", "tag", "msg"].every((k) => k in data) || [data.id, data.uid, data.username, data.tag, data.msg].some(str => str === "")) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "insufficientData",
			message: "The client did not return any or enough data."
		})
		if (!data.sessionID || !sessions.find(t => t.sessionID == data.sessionID)) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "invalidSessionID",
			message: "The client did not provide any session ID or a valid one."
		})

		if ([data.uid, data.username, data.tag, data.msg].some(str => typeof str != "string")) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "invalidDataTypes",
			message: "The client did not provide the correct data types in the message."
		})

		let session = sessions.find(t => t.sessionID == data.sessionID && t.uid == data.uid)

		if (serverCache.addons.hardCommands.has(`${data.msg.slice(1).trim().split(/ +/g)[0]}`) && data.msg.charAt(0) == "/") {
			let cmd = data.msg.slice(1).trim().split(/ +/g)[0]
			let command = null
			if (serverCache.addons.hardCommands.has(cmd)) command = serverCache.addons.hardCommands.get(cmd)
			if (command !== null) {
				if (command.data.permission == "admin" && !session.admin) return Utils.Server.send("You don't have permission to use this.", io, session.socketID)
				command.run({ Utils, User, io, session, sessions, cache: serverCache }, data, data.msg.slice(1).trim().split(/ +/g))
				return
			}
		}
		if (session.lurking) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "userIsLurking",
			message: "Client cannot send messages while lurking."
		})
		if (data.uid === "Server") return;

		data.msg = Utils.Session.sanitizeInputTags(data.msg)
		if (data.msg.trim().length > Config.maxCharacterLength) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "messageTooBig",
			message: `The message the client attempted to send was above ${Config.maxCharacterLength} characters.`
		})
		if (data.msg.trim().length == 0) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "noMessageContent",
			message: `The message the client attempted to send had no body.`
		})

		if (serverCache.addons.hardCommands.has(`${data.msg.trim().replace("/", "")}`) && data.msg.trim().charAt(0) == "/") return;
		if (serverCache.addons.chat.locked && !session.admin) return socket.emit("methodResult", {
			success: false,
			method: "messageSend",
			type: "serverLocked",
			message: `The client attempted to send a message while the server was locked.`
		})
		console.log(`${data.username}#${data.tag} ➤ ${data.msg}`)
		//locks the chat except for admins
		if (serverCache.addons.chat.chatHistory.length > 30 && Config.saveLoadHistory) serverCache.addons.chat.chatHistory.pop()

		//limit history to last 30 messages (all that will fit the screen)
		if (Config.saveLoadHistory) serverCache.addons.chat.chatHistory.push({ username: getTime() + " " + data.username, tag: data.tag, msg: data.msg.replace("\n", "") })
		io.sockets.in("authed").emit('msg', { msg: data.msg, username: data.username, tag: data.tag, uid: data.uid, id: data.id })
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
				io.sockets.in("authed").emit("method", {
					method: "userDisconnect",
					type: "serverRequest",
					user: `${d.username}#${d.tag}`
				})
				Utils.Server.broadcast(`${d.username}#${d.tag} has disconnected.`, io)
			}
		})
	})

	socket.on("method", (data) => {
		if (data.type != "clientRequest") return

		if (!data || !["uid", "sessionID"].every((k) => k in data)) return socket.emit("methodResult", {
			success: false,
			method: data.method,
			type: "insufficientData",
			message: "The client did not return any or enough data."
		})

		if (!sessions.find(t => t.sessionID == data.sessionID)) return socket.emit("methodResult", {
			success: false,
			method: data.method,
			type: "invalidSessionID",
			message: "The client did not provide any session ID or a valid one."
		})
		if (data.method == "getMemberList") {
			let memberList;
			try {
				memberList = Utils.Server.getMemberList(sessions, User)
			} catch (e) {
				socket.emit("methodResult", {
					success: false,
					method: data.method,
					type: "unableToGetMemberList",
					message: "The server was unable to get the member list."
				})
				return
			}
			socket.emit("methodResult", {
				success: true,
				method: data.method,
				type: "success",
				message: "Successfully received the member list.",
				memberList
			})
		}
	})
})

ci.on("SIGINT", () => {
	process.exit(0)
})

process.on("beforeExit", () => {
	io.sockets.in("authed").emit("disconnect")
})

server.listen(Config.port, () => {
	const userTable = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()
	const bannedTable = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'banned';").get()

	if (!userTable["count(*)"]) {
		UserDB.prepare("CREATE TABLE users (id INTEGER PRIMARY KEY, uid TEXT, username TEXT, tag TEXT, passwordHash TEXT);").run();
		UserDB.prepare("CREATE UNIQUE INDEX idx_user_id ON users (id);").run()
		UserDB.prepare("CREATE TABLE banned(uid TEXT PRIMARY KEY);").run();
		UserDB.prepare("CREATE UNIQUE INDEX idx_uid ON banned (uid);").run()
		UserDB.pragma("synchronous = 1")
		UserDB.pragma("journal_mode = wal")
		console.log("Created SQLite DB and Users table.")
	}
	if (!bannedTable["count(*)"]) {
		UserDB.prepare("CREATE TABLE banned(uid TEXT PRIMARY KEY);").run();
		UserDB.prepare("CREATE UNIQUE INDEX idx_uid ON banned (uid);").run()
		console.log("Created Banned Users table.")
	}

	console.log(`Server online on port ${Config.port}.`)
})

function getTime() {
	return `[${new Intl.DateTimeFormat({}, {timeStyle: "short", hour12: true}).format(new Date())}]`
}