exports.run = (Service, Data, args,) => {
    const fs = require('fs')
    fs.readdir('src/commands', (err, files) => {
        files.forEach(f => {
            delete require.cache[require.resolve(`./${f}`)];
        })
    })
    Service.cache.addons.hardCommands = new Map()
    Service.cache.addons.connectors.loadCmd()
    return Service.Utils.Server.send("Commands reloaded!", Service.io, Service.session.socketID)

}
exports.data = {
    name: "reload",
    desc: "Reloads commands.",
    permission: "admin"
};
