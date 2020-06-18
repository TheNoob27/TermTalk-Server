const Config = require("../../config.json")
const Server = require("../Server")

exports.run = (Service, Data, args) => {
  if (!Config.allowLurking) return Service.io.sockets.connected[Service.session.socketID].emit("methodResult", {
    success: false,
    method: "lurkAttempt",
    type: "dissallowedByServer",
    message: `This server does not allow lurking.`
  })
  Service.session.lurking = !Service.session.lurking
  let memberList
  try {
    memberList = Server.getMemberList(Service.sessions, Service.User, Service.session.channel)
  } catch (e) {
    return
  }
  Service.io.sockets.in(Service.session.channel).emit("methodResult", {
    success: true,
    method: "getMemberList",
    type: "success",
    message: "Successfully got member list",
    memberList
  })
  let bots = sessions.filter(t => t.bot)
  memberList = Server.getMemberList(Service.sessions, Service.User)
  for (let i = 0; i < bots.length; i++) {
    io.sockets.connected[bots[i].socketID].emit('methodResult', {
      success: true,
      method: "getMemberList",
      type: "success",
      message: "Successfully got member list",
      memberList
    })
  }
}
exports.data = {
  name: "lurk",
  desc: "Starts lurking.",
  permission: "normal"
};