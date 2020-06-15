const config = require("../../config.json")
const Server = require("../Server")
exports.run = (Service, Data, args) => {
  args.shift()
  let channelName = args.join(" ")
  if(!config.channels.includes(channelName) && channelName != "General") return Service.io.sockets.connected[Service.session.socketID].emit("methodResult", {
    success: false,
    method: "channelChange",
    type: "channelNotFound",
    message: `Channel not found.`
  })
  if(channelName == Service.session.channel) return Service.io.sockets.connected[Service.session.socketID].emit("methodResult", {
    success: false,
    method: "channelChange",
    type: "alreadyInChannel",
    message: `You are already in that channel.`
  })
  let oldChannel = Service.session.channel
  Service.io.sockets.connected[Service.session.socketID].leave(oldChannel || "General")
  Service.session.channel = channelName
  Service.io.sockets.connected[Service.session.socketID].join(channelName)
  let memberList
  try {
    memberList = Server.getMemberList(Service.sessions, Service.User, oldChannel || "General")
  } catch (e) {
    console.log(e)
  }
  Service.io.sockets.in(oldChannel || "General").emit("methodResult", {
    success: true,
    method: "getMemberList",
    type: "success",
    message: "Successfully got member list",
    memberList
  })
  try {
    memberList = Server.getMemberList(Service.sessions, Service.User, Service.session.channel)
  } catch (e) {
    console.log(e)
  }
  Service.io.sockets.in(Service.session.channel).emit("methodResult", {
    success: true,
    method: "getMemberList",
    type: "success",
    message: "Successfully got member list",
    memberList
  })
  Service.io.sockets.connected[Service.session.socketID].emit("methodResult", {
    success: true,
    method: "channelChange",
    type: "success",
    message: `Now in channel ${channelName}.`,
    channel: channelName
  })
  if (config.saveLoadHistory) Service.cache.addons.connectors.sendHistory(Service.cache, Service.io, Service.session.socketID, channelName)
  if(!Service.cache.addons.chat.locked[oldChannel])Service.io.sockets.in(oldChannel).emit("method", {
    method: "userChangeChannel",
    username: Data.username,
    tag: Data.tag,
    previousChannel: oldChannel,
    newChannel: channelName,
    type: "serverRequest",
    join: false
  })

  if(!Service.cache.addons.chat.locked[channelName]) Service.io.sockets.in(channelName).emit("method", {
    method: "userChangeChannel",
    username: Data.username,
    tag: Data.tag,
    previousChannel: oldChannel,
    newChannel: channelName,
    type: "serverRequest",
    join: true
  })
  return
}
exports.data = {
  name: "channel",
  desc: "Change channels.",
  permission: "normal"
};