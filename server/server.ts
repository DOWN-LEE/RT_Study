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
        if(router){
            callback(router.rtpCapabilities, null);
        }
        else{
            callback(null, {text:'there is no router'});
        }
    });

    
    socket.emit('socketConnection-finish', {type: 'finish', id: socket.id});
})


import {createWorker, types as mediaSoupTypes} from 'mediasoup';

let router: mediaSoupTypes.Router;
let worker: mediaSoupTypes.Worker;
const mediaCodecs: any =
[
  {
    kind        : "audio",
    mimeType    : "audio/opus",
    clockRate   : 48000,
    channels    : 2
  },
  {
    kind       : "video",
    mimeType   : "video/H264",
    clockRate  : 90000,
    parameters :
    {
      "packetization-mode"      : 1,
      "profile-level-id"        : "42e01f",
      "level-asymmetry-allowed" : 1
    }
  }
];

async function startWorker() {
    worker = await createWorker();
    router = await worker.createRouter({mediaCodecs});
    console.log('-- mediasoup worker start. --')
}

startWorker();