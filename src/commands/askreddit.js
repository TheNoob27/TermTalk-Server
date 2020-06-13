exports.run = (Service, Data, args) => {
    //Credit where it's due, thanks to https://www.npmjs.com/~adhikarikiran for this cool NPM module!
    const { RedditSimple } = require('reddit-simple')
    if (!Service.cache.addons.monitor.askReddit.get(`${Service.session.uid}`) || Service.cache.addons.monitor.askReddit.get(`${Service.session.uid}`).cooldown < Date.now()) {
        RedditSimple.RandomPost('askreddit').then(e => {
            Service.User.getUserByUID(Service.session.uid, (err, user) => {
                Service.Utils.Server.broadcast(`[AskReddit] | ${e[0].data.title}`, Service.io)
            })
        })
        Service.cache.addons.monitor.askReddit.set(`${Service.session.uid}`, { cooldown: Date.now() + 180000 })
    } else return Service.Utils.Server.send(`Please wait ${Service.cache.addons.connectors.msConvert((Service.cache.addons.monitor.askReddit.get(`${Service.session.uid}`).cooldown - Date.now()) / 1000)} before using AskReddit again!`, Service.io, Service.session.socketID)
}

exports.data = {
    name: 'askreddit',
    desc: "posts from r/askreddit",
    permission: "normal"
};