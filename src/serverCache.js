let cache = {}
cache.addons = {
	textCommands: new Map(),
	hardCommands: new Map(),
	monitor: {
		connected: 0,
		started: Date.now(),
		askReddit: new Map()
	},
	connectors: {
		loadCmd: require("./functions/loadCommands.js"),
		msConvert: require("./functions/secondsConvert.js")
	}
}

module.exports = cache;
