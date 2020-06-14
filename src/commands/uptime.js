exports.run = (Service, Data, args, ) => {
    return Service.Utils.Server.send(`The server has been up for ${Service.cache.addons.connectors.msConvert((Date.now() - Service.cache.addons.monitor.started) / 1000)}.`, Service.io, Service.session.socketID)
}

exports.data = {
    name: "uptime",
    desc: "Server uptime.",
    permission: "normal"
};