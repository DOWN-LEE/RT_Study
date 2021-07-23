"use strict";
var serverOptions = {
    hostName: 'localhost',
    listenPort: '3002',
    useHttps: false
};
var http = require("http");
var https = require("https");
var express = require('express');
var app = express();
var webServer = null;
if (serverOptions.useHttps) {
}
else {
    webServer = http.Server(app).listen(serverOptions.listenPort, function () {
        console.log('Web server start. http://' + serverOptions.hostName + ':' + webServer.address().port + '/');
    });
}
var io = require('socket.io');
console.log('socket.io server start. port=' + webServer.address().port);
io.on('connection', function (socket) {
    console.log('client connected. socket id=' + socket.id + '  , total clients=');
    socket.on('getRouterRtpCapabilities', function (data, callback) {
        callback(router.rtpCapabilities);
    });
});
var router = null;
//# sourceMappingURL=server.js.map