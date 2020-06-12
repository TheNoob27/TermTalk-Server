let cache = {}
cache.addons = {
    textCommands: new Map(),
    hardCommands: new Map(),
    monitor: {
        connected: 0,
        started: Date.now()
    },
    connectors: {
        loadCmd: require("./src/functions/loadCommands.js")
    }
}

module.exports = cache;
