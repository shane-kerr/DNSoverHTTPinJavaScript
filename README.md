# DNSoverHTTPinJavaScript

This is a JavaScript implementation of a [DNS over HTTP protocol]
(https://datatracker.ietf.org/doc/draft-song-dns-wireformat-http/)
client. It was done as a proof-of-concept/prototype at the IETF 96
Hackathon.

It uses the
[native-dns-packet](https://github.com/tjfontaine/native-dns-packet)
JavaScript library, which was written for Node.js. It is combined with
the code and converted to a browser version via the [Browserify]
(http://browserify.org/) tool.

To use it: 

1. Set up Node.js and the [npm](https://www.npmjs.com/) package
   manager.
   
2. Then install the native-dns-packet library and the buffercursor
   library that it depends on:

    $ npm install native-dns-packet
    $ npm install buffercursor

3. Finally, use Browserify to create JavaScript that can be included
   in an HTML:

    $ browserify dnsoverhttpjsdemo-src.js -o dnsoverhttpjsdemo.js

You can copy the `dnsoverhttpjsdemo.html` and `dnsoverhttpjsdemo.js`
to any web server and connect to it with a browser.
