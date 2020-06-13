exports.run = (Service, Data, args, ) => {
    args.shift()
    let banUid = args.join(" ")
    if (banUid == Service.session.uid) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("You cannot ban yourself.", Service.io, Service.session.socketID)
        return console.log("You cannot ban yourself.")
    }
    if (!banUid) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("No UID given.", Service.io, Service.session.socketID)
        return console.log("No UID given.")
    }
    if (banuid.includes("#")) {
        Service.User.getUser(uid, (err, user) => {
            if (err) return Service.Utils.Server.send("Invalid tag given.", Service.io, Service.session.socketID)
            banuid = user.uid
        })
    }
    let sessionToBan = Service.sessions.find(t => t.uid == banUid)
    if (!sessionToBan) {
        if (Data.uid !== "Server") return Service.Utils.Server.send("Invalid account name given.", Service.io, Service.session.socketID)
    }
    if (Service.Utils.Session.ban(banUid, Service, sessionToBan.socketID)) {
        if (Data.uid !== "Server") return Service.Utils.Server.send(`Successfully bannef user with the account name "${banUid}."`, Service.io, Service.session.socketID)
        return console.log(`Successfully bannee user with the account name "${banUid}."`)
    } else {
        if (Data.uid !== "Server") return Service.Utils.Server.send(`Unable to ban user with the account name "${banUid}." They may not be connected, or they are another admin.`, Service.io, Service.session.socketID)
        return console.log(`Unable to ban user with the account name "${banUid}." They may not be connected, or they are another admin.`)
    }
}

exports.data = {
    name: "ban",
    desc: "Bans a user.",
    permission: "admin"
};