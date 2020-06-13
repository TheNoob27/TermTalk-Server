exports.run = (Service, Data, args) => {
    function format(cmdName) {
        let space = ""
        if (cmdName.length + 5 !== 13) {
            for (let i = cmdName.length + 5; i < 13; i++) {
                space += " "
            }
            return space;
        } else return ""
    }
    let commandHold = Array.from(Service.cache.addons.hardCommands), skipped = 0, commands = 0
    Service.Utils.Server.send(`Available Commands`, Service.io, Service.session.socketID)
    Service.Utils.Server.send(`-`.repeat(50), Service.io, Service.session.socketID)
    if (args[1] && Number.isInteger(args[1])) i = Number.isInteger(args[1]) * 8 - 8
    if (!args[1] || args[1] <= 1) i = 0
    for (i; i < commandHold.length; i++) {
        if (commands >= 8) break;
        //no more than 8 commands a page
        if (!commandHold) continue;
        else commands += 1;
        //counts up to check for existing commands
        if (commandHold[i][1].data.permission == "admin" && !Service.session.admin) {
            skipped += 1
            continue;
        }
        Service.Utils.Server.send(`[${i + 1 - skipped}] ${commandHold[i][1].data.name} ${format(commandHold[i][1].data.name)} | ${commandHold[i][1].data.desc}`, Service.io, Service.session.socketID)
    }
    //if no command messages were issued, let them know!
    if (commands == 0) Service.Utils.Server.send(`No commands on this page!`, Service.io, Service.session.socketID)
    Service.Utils.Server.send(`-`.repeat(50), Service.io, Service.session.socketID)

}
exports.data = {
    name: "help",
    desc: "shows this page",
    permission: "normal"
};