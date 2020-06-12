const cache = require("../../serverCache.js")
const fs = require("fs")
function load() {
    fs.readdir('../commands/', (err, files) => {
    if (err) console.log(`Error while loading command.\nError BeloW\n----------------------------------\n${err}\n----------------------------------\n`)
    files.forEach(f => {
        console.log(`Loading command ${f.substr(f.length, f.length-3)}!`)
        if (!f.endsWith(".js")) return;
        const props = require(`../commands/${f}`)
        cache.addons.hardCommands.set(props.data.name, props);
    });
});
}

module.exports = load;