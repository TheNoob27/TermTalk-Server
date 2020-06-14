function loadHistory(cache, io, socketID) {
    io.sockets.connected[socketID].emit('method', {
        type: "serverRequest",
        method: "sendChatHistory",
        history: cache.addons.chat.chatHistory
    })
}

module.exports = loadHistory
