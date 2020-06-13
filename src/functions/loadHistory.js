function loadHistory(cache, io, socketID) {
    for(let i = 0; i< cache.addons.chat.chatHistory.length; i++) {
        if(!cache.addons.chat.chatHistory[i]) break;
        io.sockets.connected[socketID].emit('msg', { username: `${cache.addons.chat.chatHistory[i].username}`, tag: `${cache.addons.chat.chatHistory[i].tag}`, msg: `${cache.addons.chat.chatHistory[i].msg}`, uid: "Server", server: true })
    }
}

module.exports = loadHistory