exports.run = (Service, Data, args) => {
    args.shift()
    let uid = args.join(" ")
    if (uid == Service.session.uid) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("You cannot kick yourself.", Service.io, Service.session.socketID)
    }
    if (!uid) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("No UID given.", Service.io, Service.session.socketID)
    }
    if (uid.includes("#")) {
        Service.User.getUser(uid, (err, user) => {
            if (err) return Service.Utils.Server.send("Invalid tag given.", Service.io, Service.session.socketID)
            uid = user.uid
        })
    }
    let sessionToKick = Service.sessions.find(t => t.uid == uid)
    if (!sessionToKick) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("Invalid account name given.", Service.io, Service.session.socketID)
    }
    if (Service.Utils.Session.kick(sessionToKick.socketID, Service.io.sockets)) {
        if (Data.uid !== "Server") return Service.Utils.Server.send(`Successfully kicked user with the account name "${uid}."`, Service.io, Service.session.socketID)
        return console.log(`Successfully kicked user with the account name "${uid}."`)
    } else {
        if (Data.uid !== "Server") return Service.Utils.Server.send(`Unable to kick user with the account name "${uid}." They may not be connected.`, Service.io, Service.session.socketID)
        return console.log(`Unable to kick user with the account name "${uid}." They may not be connected.`)
    }
}
exports.data = {
    name: "kick",
    desc: "Kicks a user.",
    permission: "admin"
};