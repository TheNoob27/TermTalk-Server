exports.run = (Service, Data, args) => {
    Service.User.getUserByUID(Service.session.uid, (err, sender) => {
        if (!args[1]) return Service.Utils.Server.send(`You failed to provide a user.`, Service.io, Service.session.socketID)
        let pmUser = args[1]
        let uidArr = pmUser.split("#")
        let tag = uidArr.pop()
        let username = uidArr.join("#")
        Service.User.getUser(username, tag, (err, recipient) => {
            if (err || !recipient) return Service.Utils.Server.send(`Failed to fetch the user provided.`, Service.io, Service.session.socketID)
            let userSession = Service.sessions.find(e => e.uid == recipient.uid)
            if(userSession.socketID == Service.session.socketID) return Service.Utils.Server.send(`You can't DM yourself.`, Service.io, Service.session.socketID) //dont let people dm themselves
            //Service.io.sockets.connected[userSession.socketID].emit('msg', { username: , tag: "0000", msg, uid: "Server", server: true })
            let content = args.join(" ").split(args[1]), msg = content.pop().replace(" ", "") //clears extra space on pop
            Service.io.sockets.connected[Service.session.socketID].emit("msg", { username: `[DM] ${sender.username}`, tag: `${sender.tag}`, msg, uid: Service.session.uid, server: false })
            Service.io.sockets.connected[userSession.socketID].emit("msg", { username: `[DM] ${sender.username}`, tag: `${sender.tag}`, msg, uid: Service.session.uid, server: false })
            //Service.Utils.Server.send(`-`.repeat(50), Service.io, Service.session.socketID)
        })
    })

}
exports.data = {
    name: "dm",
    desc: "test",
    permission: "normal"
};