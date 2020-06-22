const FlakeId = require('flakeid')
const flake = new FlakeId({
  timeOffset: (2020 - 1970) * 31536000 * 1000 + (31536000 * 400)
})
exports.run = (Service, Data, args) => {
  args.shift()
  if(args && args.length == 0) return Service.Utils.Server.send(`No UID provided.`, Service.io, Service.session.socketID)
  Service.User.getUserByUID(args.join(" "), (err, user) => {
    if(err && err.type == "userNotExists") return Service.Utils.Server.send(`User with UID ${args.join(" ")} not found.`, Service.io, Service.session.socketID)
    else if(err) return Service.Utils.Server.send(`There was a server error, contact an admin.`, Service.io, Service.session.socketID)
    if(!user.bot) return Service.Utils.Server.send(`User with UID ${args.join(" ")} is not a bot.`, Service.io, Service.session.socketID)
    if(user.owner !== Service.session.uid) return Service.Utils.Server.send(`You are not the owner of this bot.`, Service.io, Service.session.socketID)
    Service.User._generateToken(user.id, (err, token, crypt) => {
      if(err) return Service.Utils.Server.send(`There was an error: ${err}.`, Service.io, Service.session.socketID)
      Service.User.updateSQLEntry(user.uid, ["passwordHash", "crypt"], [token, crypt])
      return Service.Utils.Server.send(`New token for ${user.uid} is: ${token}`, Service.io, Service.session.socketID)
    })
  })
}
exports.data = {
  name: "resettoken",
  desc: "Reset a bot's token.",
  permission: "normal"
};