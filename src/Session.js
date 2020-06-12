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

	static makeSessionID() {
		return crypto.randomBytes(10).toString("hex")
  }
  
  static sanitizeInputTags(text) {
    return text.replace(/[{}]/g, function(ch) {
			return ch === '{' ? '{open}' : '{close}'
		})
	}
	
	static kick(id, sockets) {
		let socket = sockets.connected[id]
		if(socket) {
			socket.emit("msg", { username: "Server", tag: "0000", msg: "{#ff0000-fg}You've been kicked.{/#ff0000-fg}", uid: "Server" })
			socket.disconnect(true)
			return true
		} else {
			return false
		}
	}
}

module.exports = Session;
