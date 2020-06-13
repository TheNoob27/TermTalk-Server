function loadHistory(cache, io, socketID) {
    for(let i = 0; i< cache.addons.monitor.chatHistory.length; i++) {
        console.log("Sending cached messages | " + i)
        if(!cache.addons.monitor.chatHistory[i]) break;
        io.sockets.connected[socketID].emit('msg', { username: "History", tag: "0000", msg: `${cache.addons.monitor.chatHistory[i]}`, uid: "Server", server: true })
    }
}

module.exports = loadHistory