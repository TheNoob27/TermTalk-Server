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

const bcrypt = require('bcrypt');
const FlakeId = require('flakeid');
const flake = new FlakeId({
	timeOffset: (2020 - 1970) * 31536000 * 1000 + (31536000 * 400)
})

class UserHandle {
	constructor(Database) {
		this.Database = Database;
	}

	register(uid, username, tag, password, callback) {
		if (uid === "Server") return callback({
			type: "invalidUID",
			message: "The UID provided is not allowed to be used."
		})
		if (username == "Server") return callback({
			type: "invalidUsername",
			message: "The username provided is not allowed to be used."
		})
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid) || this.Database.prepare("SELECT * FROM users WHERE username=? AND tag=?;").get(username, tag)
		if (user) return callback({
			type: "userExists",
			message: "A user with this UID or username/tag combo already exists."
		})
		this._hashPassword(password, (err, hash) => {
			if (err) return callback(err)

			const id = flake.gen()
			this.Database.prepare("INSERT INTO users (id, uid, username, tag, passwordHash, bot, crypt, owner) VALUES (?, ?, ?, ?, ?, ?, ?);").run(id, uid, username, tag, hash, 0, "", "")
			return callback(null, id)
		})
	}

	registerBot(uid, username, tag, user, callback) {
		const ownerExists = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(user.uid)
		if (!ownerExists) return callback({
			type: "ownerNotExists",
			message: "The user data provided was incorrect."
		})
		bcrypt.compare(user.password, ownerExists.passwordHash, (err, matched) => {
			if (err) return callback(err)
			if (!matched) return callback({
				type: "ownerCredentialsIncorrect",
				message: "The owner credentials provided were incorrect.",
				code: 401
			})

			if (uid === "Server") return callback({
				type: "invalidUID",
				message: "The UID provided is not allowed to be used.",
				code: 400
			})

			if (username == "Server") return callback({
				type: "invalidUsername",
				message: "The username provided is not allowed to be used.",
				code: 400
			})

			const exists = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
			if (exists) return callback({
				type: "userExists",
				message: "A user with this UID or username/tag combo already exists.",
				code: 400
			})

			const id = flake.gen()
			this._generateToken(id, (err, token, hash) => {
				if (err) return callback(err)

				this.Database.prepare("INSERT INTO users (id, uid, username, tag, passwordHash, bot, crypt, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?);").run(id, uid, username, tag, token, 1, hash, user.uid)
				return callback(null, token)
			})
		})
	}

	login(uid, password, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		if (!user) return callback({
			type: "userNotExists",
			message: "This user does not exist."
		})
		bcrypt.compare(password, user.passwordHash, function (err, matched) {
			return err == null ? callback(null, user, matched) : callback(err);
		})
	}

	loginBot(token, callback) {
		if (token.split(".").length < 3) {
			return callback({
				type: "invalidToken",
				message: "The token provided was invalid.",
				code: 401
			})
		}
		let id = Buffer.from(token.split(".")[1], "base64").toString("utf8")
		const bot = this.Database.prepare("SELECT * FROM users WHERE id=?;").get(id)
		if (!bot) return callback({
			type: "botNotExists",
			message: "This bot does not exist."
		})
		if (!bot.bot) return callback({
			type: "userIsNotABot",
			message: "The user you attempted to login with is not a bot."
		})
		bcrypt.compare(token.split(".").slice(2).join("."), bot.crypt, function (err, matched) {
			return err == null ? callback(null, bot, matched) : callback(err)
		})
	}

	validateBot(token, callback) {
		if (token.split(".").length < 3) {
			return callback({
				type: "invalidToken",
				message: "The token provided was invalid.",
				code: 401
			})
		}
		let id = Buffer.from(token.split(".")[1], "base64").toString("utf8")
		const bot = this.Database.prepare("SELECT * FROM users WHERE id=?;").get(id)
		if (!bot) return callback({
			type: "botNotExists",
			message: "This bot does not exist.",
			code: 404
		})
		if (!bot.bot) return callback({
			type: "userIsNotABot",
			message: "The user you attempted to login with is not a bot.",
			code: 400
		})
		bcrypt.compare(token.split(".").slice(2).join("."), bot.crypt, function (err, matched) {
			return err == null ? callback(null, matched, bot) : callback(err)
		})
	}

	getUserByUID(uid, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		if (!user) return callback({
			type: "userNotExists",
			message: "This user does not exist."
		})
		return callback(null, user)
	}

	getUser(username, tag, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE username=? AND tag=?;").get(username, tag)
		if (!user) return callback({
			type: "userNotExists",
			message: "This user does not exist."
		})
		return callback(null, user)
	}

	ban(uid, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		const banned = this.Database.prepare("SELECT * FROM banned WHERE uid=?;").get(uid)

		if (!user) return callback({
			type: "userNotExists",
			message: "This user does not exist."
		})
		if (banned) return callback({
			type: "userBanned",
			message: "This user is already banned."
		})

		this.Database.prepare("INSERT INTO banned (uid) VALUES (?);").run(uid)
	}

	isBanned(uid) {
		const banned = this.Database.prepare("SELECT * FROM banned WHERE uid=?;").get(uid)

		if (banned) return true
		return false
	}

	isBot(uid) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		return !!user.bot
	}

	_hashPassword(password, callback) {
		bcrypt.genSalt(10, function (err, salt) {
			if (err) return callback(err);

			bcrypt.hash(password, salt, (err, hash) => {
				return callback(err, hash);
			});
		});
	}

	_generateToken(id, callback) {
		let token = ""
		token += Buffer.from(Date.now().toString()).toString("base64") + "."
		token += Buffer.from(id.toString()).toString("base64") + "."
		bcrypt.genSalt(20, (err, crypt) => {
			if (err) return callback(err)
			this._hashPassword(crypt, (err2, hash) => {
				if (err2) return callback(err2)
				token += crypt
				return callback(null, token, hash)
			})
		})
	}
}

module.exports = UserHandle;