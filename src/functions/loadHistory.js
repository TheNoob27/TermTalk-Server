function loadHistory(cache, io, socketID) {
    for(let i = 0; i< cache.addons.chat.chatHistory.length; i++) {
        if(!cache.addons.chat.chatHistory[i]) break;
        io.sockets.connected[socketID].emit('msg', { username: "Server", tag: "0000", msg: `${cache.addons.chat.chatHistory[i]}`, uid: "Server", server: true })
    }
}

module.exports = loadHistory