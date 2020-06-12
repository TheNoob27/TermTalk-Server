exports.run = (Service, Data, args,) => {
    function format(cmdName) {
        let space = ""
        if (cmdName.length + 5 !== 13) {
            for (let i = cmdName.length + 5; i < 13; i++) {
                space += " "
            }
            return space;
        } else return ""
    }
    let commands = "", skipped = 0
    let commandHold = Array.from(Service.cache.addons.hardCommands)
    Service.Utils.Server.send(`Help Menu`, Service.io, Service.session.socketID)
    Service.Utils.Server.send(`-`.repeat(50), Service.io, Service.session.socketID)
    for (let i = 0; i < commandHold.length; i++) {
        if(commandHold[i][1].data.permission == "admin" && !Service.session.admin) {
            skipped+=1
            continue;
        }
        Service.Utils.Server.send(`[${i+1-skipped}] ${commandHold[i][1].data.name} ${format(commandHold[i][1].data.name)} | ${commandHold[i][1].data.desc}`, Service.io, Service.session.socketID)
    }
}
exports.data = {
    name: "help",
    desc: "shows this page",
    permission: "normal"
};