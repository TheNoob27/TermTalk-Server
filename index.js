const http = require('http').createServer()
const io = require('socket.io')(http)
const port = 3000

io.on('connection', (socket) => {
    console.log('connected')
    socket.on('message', (data) => {
        console.log(data)
        socket.broadcast.emit('message', data)
    })
})

io.on('disconnect', (data) => {
    console.log('disconnected')
})

http.listen(port, () => {
	console.log(`server listening on port: ${port}`)
})