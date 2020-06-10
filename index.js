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
const User = new Utils.UserHandle(UserDB)

// Session IDs
const sessionIDs = [{"Server":Utils.Session.makeSessionID()}]
const adminSessionIDs = [sessionIDs[0]]

// last server message timestamp
let lastServerMessageTime = null

const ci = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

io.on("connection", (socket) => {
	console.log("A user connected.")
	socket.on("login", (d) => {
		User.login(d.uid, d.password, (err, user, matched) => {
			if (err) {
				if (err.type === "userNotExists") {
					socket.emit("auth_result", {
						success: false,
						method: "login",
						...err
					})
				} else {
					socket.emit("auth_result", {
						success: false,
						method: "login",
						type: "serverError",
						message: "The server encountered an error. Be sure to contact the admin."
					})
					console.log(err)
				}
			}
			if (!matched) return socket.emit("auth_result", {
				success: false,
				method: "login",
				type: "userCredentialsWrong",
				message: "The user's credentials are wrong."
			})
			let sessionID = Utils.Session.makeSessionID()
			let o = {}
			o.sessionID = sessionID
			o.uid = user.uid
			sessionIDs.push(o)
			if(Config.adminUIDs.includes(user.uid)) adminSessionIDs.push(sessionID)
			socket.emit("auth_result", {
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
		})
	})

	socket.on("register", (data) => {
		let { uid, username, tag, password } = data
		uid = uid.trim(), username = username.trim(), tag = tag.trim(), password = password.trim()
		if (!data) return socket.emit("auth_result", {
			success: false,
			method: "register",
			type: "insufficientData",
			message: "The client did not return any data."
		})
		if (!["uid", "username", "tag", "password"].every((k) => k in data) || [uid, username, tag, password].some(str => str === "")) return socket.emit("auth_result", {
			success: false,
			method: "register",
			type: "insufficientData",
			message: "The client did not return enough data."
		})
		if(tag.length > 4) return socket.emit("auth_result", {
			success: false,
			method: "register",
			type: "invalidTag",
			message: "The client provided an invalid tag."
		})
		User.register(uid, username, tag, password, (err) => {
			if (err) {
				if (err.type === "userExists") {
					socket.emit("auth_result", {
						success: false,
						method: "register",
						...err
					})
					return
				} else {
					socket.emit("auth_result", {
						success: false,
						method: "register",
						type: "serverError",
						message: "The server encountered an error. Be sure to contact the admin."
					})
					console.log(err)
					return
				}
			}
			let sessionID = Utils.Session.makeSessionID()
			let o = {}
			o.sessionID = sessionID
			o.uid = uid
			sessionIDs.push(o)
			socket.emit("auth_result", {
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
		})
	})

	ci.on("line", (input) => {
		if(lastServerMessageTime == Date.now()) return
		lastServerMessageTime = Date.now()
		io.sockets.in("authed").emit('msg', { username: "Server", tag: "0000", msg: input, uid: "Server" })
	})

	socket.on("msg", (data) => {
		if(!data.sessionID || !sessionIDs.find(t => t.sessionID == data.sessionID)) return socket.emit("method_result", {
			success: false,
			method: "messageSend",
			type: "invalidSessionID",
			message: "The client did not provide any session ID or a valid one."
		});
		if(data.msg.startsWith("/ban") && adminSessionIDs.includes(data.sessionID)){
			// handleban
		}else if(data.msg.startsWith("/kick") && adminSessionIDs.includes(data.sessionID)){
			// handlekick
		}
		if (data.uid === "Server") return;
		delete data.sessionID
		data.msg = Utils.Session.sanitizeInputTags(data.msg)
		console.log(`${data.username}#${data.tag} ${data.msg}`)
		io.sockets.in("authed").emit('msg', data)
	})

	socket.on("disconnecting", (data) => {
		console.log("A user disconnected.")
		sessionIDs.splice(sessionIDs.indexOf(data.sessionID), 1)
	})

	process.on("beforeExit", () => {
		io.sockets.in("authed").emit('disconnect')
	})
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