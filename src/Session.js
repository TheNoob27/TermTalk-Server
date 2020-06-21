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

const crypto = require("crypto")

class Session {
	static Database = null

	static makeSessionID() {
		return crypto.randomBytes(10).toString("hex")
	}

	static sanitizeInputTags(text) {
		return text.replace(/[{}]/g, function (ch) {
			return ch === '{' ? '{open}' : '{/close}'
		})
	}

	static kick(id, sockets) {
		let socket = sockets.connected[id]
		if (socket) {
			socket.emit("msg", { username: "Server", tag: "0000", msg: "You've been kicked.", uid: "Server" })
			socket.disconnect(true)
			return true
		} else {
			return false
		}
	}

	static ban(uid, Service, socketID) {
		if (Service.session.admin) return false
		let socket = Service.io.sockets.connected[socketID]
		if (socket) {
			Service.User.ban(uid, (err) => {
				if (err) return false

				Service.User.getUserByUID(uid, (err, data) => {
					if (err) return true

					Service.server.broadcast(`${data.username}#${data.tag} has been banned.`, Service.io, null, Service.sessions)
					socket.disconnect(true)
					return true
				})
			})
		} else {
			return false
		}
	}

	static sessionInDatabase(sessionID){
		const session = this.Database.prepare("SELECT * FROM oldSessions WHERE sessionID=?;").get(sessionID)
		if (!session) return false
		this.removeSessionFromDatabase(sessionID)
		return true
	}

	static addSessionToDatabase(session) {
		const possibleSession = this.Database.prepare("SELECT * FROM oldSessions WHERE sessionID=?;").get(session.sessionID)
		if (possibleSession) return false
		this.Database.prepare("INSERT INTO oldSessions (sessionID, uid, expireTime) VALUES (?, ?, ?);").run(session.sessionID, session.uid, (Date.now() + 300000).toString())
		return true
	}

	static removeSessionFromDatabase(sessionID) {
		const session = this.Database.prepare("SELECT * FROM oldSessions WHERE sessionID=?;").get(sessionID)
		if (!session) return false
		this.Database.prepare("DELETE FROM oldSessions WHERE sessionID>=?;").run(sessionID)
		return true
	}

	static removeOldSessionsFromDatabase() {
		this.Database.prepare("DELETE FROM oldSessions WHERE expireTime>=?;").run(Date.now())
	}
}

module.exports = Session;
