function loadHistory(cache, io, socketID, channel) {
    io.sockets.connected[socketID].emit('method', {
        type: "serverRequest",
        method: "sendChatHistory",
        history: cache.addons.chat.chatHistory[channel] || []
    })
}

module.exports = loadHistory
