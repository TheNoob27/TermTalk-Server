const { Server } = require("../Utils");
// GET THIS TO WORK WITH SERVERS

exports.run = (Service, Data, args,) => {
    Service.User.getUserByUID(Service.session.uid, (err, user) => {
        if(err) return Service.Utils.Server.send(`An error occured while locking the chat`, Service.io, Service.session.socketID)

        if (Service.cache.addons.chat.locked[Service.session.channel]) {
            Service.cache.addons.chat.locked[Service.session.channel] = false
            Service.Utils.Server.send(`You unlocked the chat`, Service.io, Service.session.socketID)
            Service.Utils.Server.broadcast(`The server chat has been unlocked by ${user.username}#${user.tag}`, Service.io, Service.session.channel)
        } else {
            Service.cache.addons.chat.locked[Service.session.channel] = true
            Service.Utils.Server.send(`You locked the chat`, Service.io, Service.session.socketID)
            Service.Utils.Server.broadcast(`The server chat has been locked by ${user.username}#${user.tag}`, Service.io, Service.session.channel)
        }
    })
}

exports.data = {
    name: "chatlock",
    desc: "Locks the chat.",
    permission: "admin"
};