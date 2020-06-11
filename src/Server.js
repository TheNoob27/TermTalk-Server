class Server {
	static send(msg, io, socketID) {
		return io.sockets.connected[socketID].emit('msg', { username: "Server", tag: "0000", msg, uid: "Server" })
	}
}

module.exports = Server;