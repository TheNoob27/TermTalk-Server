const http = require('http').createServer()
const io = require('socket.io')(http)
const port = 3000

io.on("connection", (socket) => {
    console.log('User connected.')
    socket.on("login", (data) => {
		console.log("LOGIN DATA\n%s", data)
		socket.emit("ready")
	})
	socket.on('message', (data) => {
        console.log("MESSAGE DATA\n%s", data)
        socket.broadcast.emit("message", data)
        socket.emit("ready")
    })
})

io.on("disconnect", (data) => {
    console.log("User disconnected.")
})

http.listen(port, () => {
	console.log(`server listening on port: ${port}`)
})