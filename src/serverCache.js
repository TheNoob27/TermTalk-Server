let cache = {}
cache.addons = {
	textCommands: new Map(),
	hardCommands: new Map(),
	chat: {
		chatHistory: {},
		locked: {}
	},
	monitor: {
		connected: 0,
		started: Date.now()
	},
	connectors: {
		loadCmd: require("./functions/loadCommands.js"),
		msConvert: require("./functions/secondsConvert.js"),
		sendHistory: require("./functions/loadHistory.js")
	}
}

cache.sessions = []

module.exports = cache;
