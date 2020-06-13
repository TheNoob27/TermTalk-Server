function loadHistory(cache, io, socketID) {
    for(let i = 0; i< cache.addons.monitor.chatHistory.length; i++) {
        if(!cache.addons.monitor.chatHistory[i]) break;
        io.sockets.connected[socketID].emit('msg', { username: "Server", tag: "0000", msg: `${cache.addons.monitor.chatHistory[i]}`, uid: "Server", server: true })
    }
}

module.exports = loadHistory