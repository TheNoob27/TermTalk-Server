class Session{
  static crypto = require("crypto")

  static makeSessionID(){
    return this.crypto.randomBytes(10).toString("hex")
  }
}

module.exports = Session