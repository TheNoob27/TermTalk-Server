# Deciding to make a public server

When you decide to make a public server, you should know that, while TermTalk does offer an open source and secure server solution, **this service is offered as is with no liability or warranty**. Basically, this means that you are resposible for the things that happen on/to your server.

# Easy as...

To have a public server appear in the server list, you must set the config variable `"publicServer"` to `true` and change `"publicIP"` to your servers public ip (the thing people will connect with, **not `0.0.0.0` or `localhost`**). If either of these are `false` or incorrect, respectively, your server (as long as it isn't modified not to) will be removed from the server list.

You can also give your server a name by changing the `"serverName"` variable to whatever you want. If your server name is hateful, or your server is found to break any applicale laws, it will be removed as soon as found.

Public servers **may not** disable pinging. All servers that do not receive a successful ping from the server will not be listed. This is a dynamic function, so your server can pop in an out of the list as it comes online and goes offline (Abusing this will get you ip banned from listing servers).

# IMPORTANT NOTICES

When you make a public server, the server list will return a `key` on successful add. **You must save this if you want to remove your server from the list** (the unmodifed server does this for you).

# SSL

Version 0.3.1 added secure servers as a possibility using SSL. Securing your server will give your server a "Secure" text after the member count to show that your server uses SSL. All you have to do is change `secure` in config to `true` and edit the 3 file locations beneath it. Letsencrypt is a good way to obtain a free SSL certificate if you want to secure your server for free. Securing your server makes use of SSL's (usually) 256 bit encryption algorithm end to end to ensure, even if there are snoopers on the connection, they'd have to go through a rigorous decrypting algorithm that [usually takes millions of years](https://www.digicert.com/blog/cost-crack-256-bit-ssl-encryption/).

# The config.

Most of the config is pretty self-explanatory, but there are some advanced options:

`enableAPIEndpoints` - Enables the api for bot creation.