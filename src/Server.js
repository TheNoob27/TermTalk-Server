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

const Config = require("../config.json")

class Server {
	static send(msg, io, socketID) {
		return io.sockets.connected[socketID].emit('msg', { username: "Server", tag: "0000", msg, uid: "Server", server: true })
	}

	static broadcast(msg, io, channel) {
		if(!channel) return io.emit('msg', { username: "Server", tag: "0000", msg, uid: "Server", server: true })
		return io.sockets.in(channel).emit('msg', { username: "Server", tag: "0000", msg, uid: "Server", server: true })
	}

	static getMemberList(sessions, UserHandle, channel) {
		let clonedSessions = JSON.parse(JSON.stringify(sessions))
		if(channel) clonedSessions = clonedSessions.filter(t => t.channel == channel || t.bot)
		let length = clonedSessions.length
		if(Config.allowLurking) clonedSessions = clonedSessions.filter(t => !t.lurking)
		let lurkers = length - clonedSessions.length
		let list = clonedSessions.map(t => UserHandle.getUserByUID(t.uid, (err, user) => {
			if (err) return ""
			return `${user.username}#${user.tag}${t.admin ? " +" : ""}`
		})).filter(t => t != "")
		if(lurkers > 0) list.push(`${list.length > 0 ? `+ ${lurkers} lurker(s)` : `${lurkers} lurker(s)`}`)
		return list
	}

	static userIsConnected(uid, sessions) {
		return sessions.find(t => t.uid == uid) !== undefined
	}
}

module.exports = Server;
