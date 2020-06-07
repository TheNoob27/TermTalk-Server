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
const readline = require("readline")

const Database = require('better-sqlite3')

// Our files or utils
const Utils = require("./src/Utils.js")
const Config = require("./config.json")

// Constructors
const UserDB = new Database('./Databases/TermTalk_Users.db')
const User = new Utils.UserHandle(UserDB)

const ci = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

io.on('connection', (socket) => {
	console.log('connected')
	socket.on("login", (d) => {
		User.login(d.uid, d.password, (err, matched) => {
			if(err) {
				socket.emit("auth_fail")
				console.log(err)
			}
			if(!matched) return socket.emit("auth_fail")
			socket.emit("auth_success")
			socket.join("authed")
		})
	})

	socket.on("register", (data) => {
		let {uid, username, tag, password} = data
		uid = uid.trim(), username = username.trim(), tag = tag.trim(), password = password.trim()
		if(!data) return socket.emit("auth_result", {
			success: false,
			method: "register",
			type: "insufficientData",
			message: "The client did not return any data."
		})
		if(!["uid", "username", "tag", "password"].some((k) => !(k in data)) || [uid, username, tag, password].some(str => str === "")) return socket.emit("auth_result", {
			success: false,
			method: "register",
			type: "insufficientData",
			message: "The client did not return enough data."
		})
		User.register(uid, username, tag, password, (err) => {
			if(err) {
				if(err.type === "userExists") {
					socket.emit("auth_result", {
						success: false,
						method: "register",
						...err
					})
				} else {
					socket.emit("auth_result", {
						success: false,
						method: "register",
						type: "serverError",
						message: "The server encountered an error"
					})
					console.log(err)
				}
			}
			socket.emit("auth_success")
			socket.join("authed")
		})
	})

	ci.on("line", (input) => {
		io.sockets.in("authed").emit('msg', {username: "Server", tag: "0000", msg: input})
	})

	socket.on('msg', (data) => {
		if(d.username === "Server") return;
		io.sockets.in("authed").emit('msg', data)
	})
})

io.on('disconnect', (data) => {
	console.log('disconnected')
})

http.listen(Config.port, () => {
	const table = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()
	if (!table["count(*)"]) {
		db.prepare("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, tag TEXT, uid TEXT, passwordHash TEXT);").run();
		db.prepare("CREATE UNIQUE INDEX idx_user_id ON users (id);").run()
		db.pragma("synchronous = 1")
		db.pragma("journal_mode = wal")
		console.log("Created SQLite users database and table.")
	}

	console.log(`Server online on port ${Config.port}.`)
})

function emptyVals(object, filterArray) {
    return [" ", ""].some(e => {
    	Object.values(["uid", "username", "tag", "password"].reduce((obj, key) => ({ ...obj, [key]: object[key] }), {})).includes(e)
    })
}