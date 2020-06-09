const bcrypt = require('bcrypt');
const FlakeId = require('flakeid'); 
const flake = new FlakeId({
    timeOffset: (2020-1970)*31536000*1000
})

class UserHandle {
	constructor(Database) {
		this.Database = Database;
	}

	register(uid, username, tag, password, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		if(user) return callback({
			type: "userExists",
			message: "A user with this UID already exists."
		})
		this._hashPassword(password, (err, hash) => {
			if(err) return callback(err)

			this.Database.prepare("INSERT INTO users (id, uid, username, tag, passwordHash) VALUES (?, ?, ?, ?, ?);").run(flake.gen(), uid, username, tag, hash)
			return callback(null, true)
		})
	}

	login(uid, password, callback) {
		const user = this.Database.prepare("SELECT * FROM users WHERE uid=?;").get(uid)
		if(!user) return callback({
			type: "userNotExists",
			message: "This user does not exist."
		})
		bcrypt.compare(password, user.passwordHash, function(err, matched) {   
			return err == null ? callback(null, matched) : callback(err);
		})
	}

	_hashPassword(password, callback) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err) return callback(err);

			bcrypt.hash(password, salt, (err, hash) => {
				return callback(err, hash);
			});
		});
	}
}

module.exports = UserHandle;