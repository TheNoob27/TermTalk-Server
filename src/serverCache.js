let cache = {}
cache.addons = {
	textCommands: new Map(),
	hardCommands: new Map(),
	chat: {
		chatHistory: {},
		locked: {},
		rateLimits: new Map()
	},
	monitor: {
		connected: 0,
		started: Date.now()
	},
	connectors: {
		loadCmd: require("./functions/loadCommands.js"),
		msConvert: require("./functions/secondsConvert.js"),
		sendHistory: require("./functions/loadHistory.js"),
		rateLimit: require("./functions/ratelimit.js")
	}
}

cache.sessions = []

module.exports = cache;
