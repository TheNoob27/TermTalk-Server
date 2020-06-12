exports.run = (Data, message, args, ) => {
    return Data.Utils.Server.send("This is a test", Data.io, Data.session.socketID)
}
exports.data = {
    name: 'test',
    desc: "Test"
};