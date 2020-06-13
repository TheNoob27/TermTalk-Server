const { Server } = require("../Utils");

exports.run = (Service, Data, args,) => {
    Service.User.getUserByUID(Service.session.uid, (err, user) => {
        if(err) return Service.Utils.Server.send(`An error occured while locking the chat`, Service.io, Service.session.socketID)

        if (Service.cache.addons.chat.locked) {
            Service.cache.addons.chat.locked = false
            Service.Utils.Server.send(`You unlocked the chat`, Service.io, Service.session.socketID)
            Service.Utils.Server.broadcast(`The server chat has been unlocked by ${user.username}#${user.tag}`, Service.io)
        } else {
            Service.cache.addons.chat.locked = true
            Service.Utils.Server.send(`You locked the chat`, Service.io, Service.session.socketID)
            Service.Utils.Server.broadcast(`The server chat has been locked by ${user.username}#${user.tag}`, Service.io)
        }
    })
}

exports.data = {
    name: "chatlock",
    desc: "locks the chat",
    permission: "normal"
};