const FlakeId = require('flakeid')
const flake = new FlakeId({
  timeOffset: (2020 - 1970) * 31536000 * 1000 + (31536000 * 400)
})
exports.run = (Service, Data, args) => {
  args.shift()
  if (args.length == 0) {
    getBots(Service.session.uid, Service)
  } else {
    Service.User.getUser(args.join(" "), (err, user) => {
      if(err && err.type == "userNotExists") return Service.Utils.Server.send(`User not found.`, Service.io, Service.session.socketID)
      else if(err) return Service.Utils.Server.send(`There was a server error, contact an admin.`, Service.io, Service.session.socketID)
      getBots(user.uid, Service)
    })
  }
}
exports.data = {
  name: "getbots",
  desc: "Get bots of a user or yourself and their tokens if you own them.",
  permission: "normal"
};

function getBots(uid, Service){
  Service.User.getBots(uid, (bots) => {
    if (bots.length == 0) return Service.Utils.Server.send(`No bots found.`, Service.io, Service.session.socketID)
    if(uid == Service.session.uid) return Service.Utils.Server.send(bots.map(b => `${b.uid} | ${b.username}#${b.tag} | ${b.passwordHash}`).join("\n\n"), Service.io, Service.session.socketID)
    return Service.Utils.Server.send(bots.map(b => `${b.uid} | ${b.username}#${b.tag}`).join("\n\n"), Service.io, Service.session.socketID)
  })
}