function ratelimit(cache, io, socketID, channel) {
    const Config = require("../../config.json")
    if (cache.addons.chat.rateLimits.get(socketID + `#${channel}`) !== undefined && cache.addons.chat.rateLimits.get(socketID + `#${channel}`).time > Date.now()) {
        io.sockets.connected[socketID].emit('ratelimited', {
            seconds: (Math.floor(cache.addons.chat.rateLimits.get(socketID + `#${channel}`).time - Date.now()) / 1000).toFixed(1)
        })
        return true;
    } else cache.addons.chat.rateLimits.set(socketID + `#${channel}`, { time: Date.now() + Config.messageRatelimit * 1000 })
}

module.exports = ratelimit
