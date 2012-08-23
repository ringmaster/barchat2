[![build status](https://secure.travis-ci.org/ringmaster/barchat2.png)](http://travis-ci.org/ringmaster/barchat2)
BarChat2 - A realtime web-based chat system based on node.js
============================================================

BarChat2 is an open-source, realtime web-based chat system implemented using some newer web technologies, including node.js, MongoDB, and client-side templating.  BarChat brings some unique capabilities to online web chat that aren't found in many commercial products, including simultaneous connections to multiple servers via a single client interface, and the capability to display and build custom chat effects.

REQUIREMENTS :
==============
These must be installed for BarChat to work correctly:

 * MongoDB
 * node.js

INSTALLATION :
==============

 1. Download the archive from https://github.com/ringmaster/barchat2 or use git to clone the repo

 2. Within the barchat directory, run this to update all the required node modules:
 ```npm update```

 3. Start the server:
 ```node barchat.js```

OPERATION :
===========

By default, BarChat is accessible over the web via port 8080 on any host available on the server.