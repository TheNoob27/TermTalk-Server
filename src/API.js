const config = require("../config.json")
const url = require("url") // Built in node url

class API {
  static handleGET(req, res, Service) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bot ")) {
      let toWrite = JSON.stringify({
        method: "botValidate",
        type: "invalidToken",
        message: "No valid token provided.",
        code: 401,
        success: false
      })
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(toWrite)
    }
    Service.User.validateBot(req.headers.authorization.slice(4), (err, matched, bot) => {
      if(bot.passwordHash !== req.headers.authorization.slice(4)) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: "invalidToken",
          message: "The token provided was invalid.",
          code: 401,
          success: false
        })
        res.writeHead(401, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      if (err) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: err.type,
          message: err.message || "Server error.",
          code: err.code || 500,
          success: false
        })
        res.writeHead(err.code || 500, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      if (!matched) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: "invalidToken",
          message: "The token provided was not valid.",
          code: 401,
          success: false
        })
        res.writeHead(401, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      let paths = req.url.slice(1).split("/")
      if (paths[0].startsWith("channels")) {
        getChannelList(req, res, Service)
      } else if (paths[0].startsWith("members")) {
        getMemberList(req, res, Service)
      }
    })
  }

  static handlePOST(req, res, Service) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bot ")) {
      let toWrite = JSON.stringify({
        method: "botValidate",
        type: "invalidToken",
        message: "No valid token provided.",
        code: 401,
        success: false
      })
      res.writeHead(401, { "Content-Type": "application/json" })
      return res.end(toWrite)
    }
    Service.User.validateBot(req.headers.authorization.slice(4), (err, matched, bot) => {
      if(bot.passwordHash !== req.headers.authorization.slice(4)) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: "invalidToken",
          message: "The token provided was invalid.",
          code: 401,
          success: false
        })
        res.writeHead(401, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      if (err) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: err.type,
          message: err.message || "Server error.",
          code: err.code || 500,
          success: false
        })
        res.writeHead(err.code || 500, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      if (!matched) {
        let toWrite = JSON.stringify({
          method: "botValidate",
          type: "invalidToken",
          message: "The token provided was not valid.",
          code: 401,
          success: false
        })
        res.writeHead(401, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      let paths = req.url.slice(1).split("/")
      if (paths[0] == "channels") {
        handleMessageSend(req, res, Service)
      } else if (paths[0] == "bot") {
        handleBot(req, res, Service)
      }
    })
  }
}

function getChannelList(req, res, Service) {
  let query
  try {
    query = url.parse(req.url, true).query
  } catch (e) {
    let toWrite = JSON.stringify({
      code: 400,
      message: "Expected url form encoded input.",
      type: "badInput",
      method: "getChannelList",
      success: false
    })
    res.writeHead(200, { "Content-Type": "application/json" })
    return res.end(toWrite)
  }
  if (!query.sessionID || !Service.sessions.find(t => t.sessionID == query.sessionID)) {
    let toWrite = JSON.stringify({
      method: "messageSend",
      type: "invalidSessionID",
      message: "No valid session ID provided.",
      code: 401,
      success: false
    })
    res.writeHead(401, { "Content-Type": "application/json" })
    return res.end(toWrite)
  }
  let toWrite = JSON.stringify({
    channels: ["General", ...config.channels],
    code: 200,
    message: "Retrieved channel list.",
    type: "success",
    success: true,
    method: "getChannelList"
  })
  res.writeHead(200, { "Content-Type": "application/json" })
  return res.end(toWrite)
}

function getMemberList(req, res, Service) {
  let query
  try {
    query = url.parse(req.url, true).query
  } catch (e) {
    let toWrite = JSON.stringify({
      code: 400,
      message: "Expected url form encoded input.",
      type: "badInput",
      method: "getChannelList",
      success: false
    })
    res.writeHead(400, { "Content-Type": "application/json" })
    return res.end(toWrite)
  }
  if (!query.sessionID || !Service.sessions.find(t => t.sessionID == query.sessionID)) {
    let toWrite = JSON.stringify({
      method: "messageSend",
      type: "invalidSessionID",
      message: "No valid session ID provided.",
      code: 401,
      success: false
    })
    res.writeHead(401, { "Content-Type": "application/json" })
    return res.end(toWrite)
  }

  let list = Service.Utils.Server.getMemberList(Service.sessions, Service.User, query.channel || "")
  let toWrite = JSON.stringify({
    members: list,
    code: 200,
    message: "Retrieved member list.",
    type: "success",
    success: true,
    method: "getMemberList"
  })
  res.writeHead(200, { "Content-Type": "application/json" })
  return res.end(toWrite)
}

function handleMessageSend(req, res, Service) {
  let paths = req.url.slice(1).split("/")
  if (paths[1] != "General" && !config.channels.includes(paths[1])) {
    let toWrite = JSON.stringify({
      code: 404,
      message: "Channel not found",
      method: "messageSend",
      type: "channelNotFound",
      success: false
    })
    res.writeHead(404, { "Content-Type": "application/json" })
    return res.end(toWrite)
  } else {
    if (req.headers["content-type"] !== "application/json") {
      let toWrite = JSON.stringify({
        code: 400,
        message: "Expected JSON input.",
        type: "badInput",
        method: "messageSend",
        success: false
      })
      res.writeHead(400, { "Content-Type": "application/json" })
      return res.end(toWrite)
    }
    let body = []
    req.on("data", (c) => body.push(c)).on("end", () => {
      try {
        body = JSON.parse(Buffer.concat(body).toString())
      } catch (e) {
        let toWrite = JSON.stringify({
          code: 400,
          message: "Expected JSON input.",
          type: "badInput",
          method: "messageSend",
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      if (!body || !["id", "uid", "username", "tag", "msg"].every((k) => k in body) || [body.id, body.uid, body.username, body.tag, body.msg].some(str => str === "")) {
        let toWrite = JSON.stringify({
          method: "messageSend",
          type: "insufficientData",
          message: "Did not receive any or enough data.",
          code: 400,
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      if (!body.sessionID || !Service.sessions.find(t => t.sessionID == body.sessionID)) {
        let toWrite = JSON.stringify({
          method: "messageSend",
          type: "invalidSessionID",
          message: "No valid session ID provided.",
          code: 401,
          success: false
        })
        res.writeHead(401, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      if ([body.uid, body.username, body.tag, body.msg].some(str => typeof str != "string")) {
        let toWrite = JSON.stringify({
          method: "messageSend",
          type: "invalidDataTypes",
          message: "Received incorrect data types.",
          code: 400,
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }
      if (!body.channel) body.channel = paths[1]
      Service.io.sockets.in(paths[1]).emit("msg", body)
      let toWrite = JSON.stringify({
        code: 200,
        message: "Sent.",
        type: "success",
        method: "messageSend",
        success: true
      })
      res.writeHead(200, { "Content-Type": "application/json" })
      return res.end(toWrite)
    })
  }
}

function handleBot(req, res, Service) {
  let paths = req.url.slice(1).split("/")
  if (paths[1] == "create") {
    if (req.headers["content-type"] !== "application/json") {
      let toWrite = JSON.stringify({
        code: 400,
        message: "Expected JSON input.",
        type: "badInput",
        method: "botCreate",
        success: false
      })
      res.writeHead(400, { "Content-Type": "application/json" })
      return res.end(toWrite)
    }
    let body = []
    req.on("data", (c) => body.push(c)).on("end", () => {
      try {
        body = JSON.parse(Buffer.concat(body).toString())
      } catch (e) {
        let toWrite = JSON.stringify({
          code: 400,
          message: "Expected JSON input.",
          type: "badInput",
          method: "botCreate",
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      if (!body || !["ownerUid", "ownerPassword", "uid", "username", "tag"].every((k) => k in body) || [body.ownerUid, body.ownerPassword, body.uid, body.username, body.tag].some(str => str === "")) {
        let toWrite = JSON.stringify({
          method: "botCreate",
          type: "insufficientData",
          message: "Did not receive any or enough data.",
          code: 400,
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      if ([body.ownerUid, body.ownerPassword, body.uid, body.username, body.tag].some(str => typeof str != "string")) {
        let toWrite = JSON.stringify({
          method: "botCreate",
          type: "invalidDataTypes",
          message: "Received incorrect data types.",
          code: 400,
          success: false
        })
        res.writeHead(400, { "Content-Type": "application/json" })
        return res.end(toWrite)
      }

      Service.User.registerBot(body.uid, body.username, body.tag, { uid: body.ownerUid, password: body.ownerPassword }, (err, token) => {
        if (err) {
          let code = err.code
          let toWrite = JSON.stringify({
            method: "botCreate",
            ...err,
            success: false
          })
          res.writeHead(code, { "Content-Type": "application/json" })
          return res.end(toWrite)
        }
        let toWrite = JSON.stringify({
          code: 200,
          message: "Successfully created bot.",
          type: "success",
          method: "botCreate",
          token
        })
        res.writeHead(200, { "Content-Type": "application/json" })
        return res.end(toWrite)
      })
    })
  }

}

module.exports = API