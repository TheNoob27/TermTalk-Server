# Deciding to make a public server

When you decide to make a public server, you should know that, while TermTalk does offer an open source and secure server solution, **this service is offered as is with no liability or warranty**. Basically, this means that you are resposible for the things that happen on/to your server.

# Easy as...

To have a public server appear in the server list, you must set the config variable `"publicServer"` to `true` and change `"publicIP"` to your servers public ip (the thing people will connect with, **not `0.0.0.0` or `localhost`**). If either of these are `false` or incorrect, respectively, your server (as long as it isn't modified not to) will be removed from the server list.

You can also give your server a name by changing the `"serverName"` variable to whatever you want. If your server name is hateful, or your server is found to break any applicale laws, it will be removed as soon as found.

# IMPORTANT NOTICES

When you make a public server, the server list will return a `key` on successful add. **You must save this if you want to remove your server from the list**.