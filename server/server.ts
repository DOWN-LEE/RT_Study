let serverOptions = {
    hostName: 'localhost',
    listenPort: '3002',
    useHttps: false
};

const http = require("http");
const https = require("https");
const express = require('express');

const app = express();

let webServer : any = null;

if(serverOptions.useHttps){

}
else{
    webServer = http.Server(app).listen(serverOptions.listenPort, function () {
        console.log('Web server start. http://' + serverOptions.hostName + ':' + webServer.address().port + '/');
    });
}

const io = require('socket.io')(webServer, {path : '/server'});

console.log('socket.io server start. port=' + webServer.address().port);
io.on('connection', (socket : any)=>{
    console.log('client connected. socket id=' + socket.id + '  , total clients=');

    
    socket.on('disconnect', ()=>{
        console.log('client disconnected. socket id=' + socket.id);

        /*
        TODO
        */
    })

    socket.on('getRouterRtpCapabilities', (data : any, callback : any) => {
        callback(router.rtpCapabilities);
    });
})



let router : any = null;