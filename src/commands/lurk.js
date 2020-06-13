const Config = require("../../config.json")
const Server = require("../Server")

exports.run = (Service, Data, args) => {
  if(!Config.allowLurking) return Service.io.sockets.connected[Service.session.socketID].emit("methodResult", {
    success: false,
    method: "lurkAttempt",
    type: "dissallowedByServer",
    message: `This server does not allow lurking.`
  })
   Service.session.lurking = !Service.session.lurking
   let memberList
    try {
      memberList = Server.getMemberList(Service.sessions, Service.User)
    } catch (e) {
      return
    }
    Service.io.sockets.in("authed").emit("methodResult", {
      success: true,
      method: "getMemberList",
      type: "success",
      message: "Successfully got member list",
      memberList
    })
}
exports.data = {
  name: "lurk",
  desc: "Starts lurking.",
  permission: "all"
};