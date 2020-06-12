function load() {
    const cache = require("../../serverCache.js")
    const fs = require("fs")
    fs.readdir('src/commands', (err, files) => {
        if (err) console.log(`Error while loading command.\nError Below\n${"-".repeat(36)}\n${err}\n${"-".repeat(36)}\n`)
        files.forEach(f => {
            console.log(`Loading command ${f}!`)
            if (!f.endsWith(".js")) return;
            const props = require(`../commands/${f}`)
            cache.addons.hardCommands.set(props.data.name, props);
        });
    });
}

module.exports = load;
