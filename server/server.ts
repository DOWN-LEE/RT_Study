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
        cleanUpPeer(socket);
       
    })

    socket.on('getRouterRtpCapabilities', (data : any, callback : any) => {
        if(router){
            callback(router.rtpCapabilities, null);
        }
        else{
            callback(null, {text:'there is no router'});
        }
    });



    // producer
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    socket.on('createProducerTransport', async (data: any, callback: any) => {
        const { transport, params } = await createTransport();
        addProducerTrasport(socket.id, transport);
        transport.observer.on('close', () => {
            const id = socket.id;
            const videoProducer = getProducer(id, 'video');
            if (videoProducer) {
                videoProducer.close();
                removeProducer(id, 'video');
            }
            const audioProducer = getProducer(id, 'audio');
            if (audioProducer) {
                audioProducer.close();
                removeProducer(id, 'audio');
            }
            removeProducerTransport(id);
        });
        //console.log('-- createProducerTransport params:', params);
        callback(params, null);
    });

    socket.on('connectProducerTransport', async (data: any, callback: any) => {
        const transport = getProducerTrasnport(socket.id);
        await transport.connect({ dtlsParameters: data.dtlsParameters });
        callback({}, null);
    });

    socket.on('produce', async (data: any, callback: any) => {
        const { kind, rtpParameters } = data;
        const id = socket.id;
        const transport = getProducerTrasnport(id);
        if (!transport) {
            console.error('transport NOT EXIST for id=' + id);
            return;
        }
        const producer = await transport.produce({ kind, rtpParameters });
        addProducer(id, producer, kind);
        producer.observer.on('close', () => {
            console.log('producer closed --- kind=' + kind);
        })
        callback({ id: producer.id }, null);

        // inform clients about new producer
        console.log('--broadcast newProducer ---');
        socket.broadcast.emit('newProducer', { socketId: id, producerId: producer.id, kind: producer.kind });
    });



    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    // consumer
    socket.on('createConsumerTransport', async(data: any, callback: any) => {
        console.log('create consumer transport. socket id=' + socket.id);
        const {transport, params} = await createTransport();
        addConsumerTransport(socket.id, transport);
        transport.observer.on('close', ()=>{
            /*
            TODO
            */
            removeConsumerTransport(socket.id);
        })

        callback(params, null);
    });

    socket.on('connectConsumerTransport', async(data: any, callback: any) => {
        let transport = getConsumerTransport(socket.id);
        if(!transport){
            console.log('There is no consumer transport. socket id=' + socket.id);
            return;
        }
        await transport.connect({dtlsParameters: data.dtlsParameters});
        callback({}, null);
    });

    socket.on('getOtherProducers', async(data: any, callback: any) =>{
        const localId = data.localId;
        const otherProducersVideoIds = getOtherProducers(localId, 'video');
        const otherProducersAudioIds = getOtherProducers(localId, 'audio');

        callback({VideoIds: otherProducersVideoIds, AudioIds: otherProducersAudioIds}, null);
    });

    socket.on('consumeAdd', async(data: any, callback: any) => {
        const localId = socket.id;
        const kind = data.kind;
        
        let transport = getConsumerTransport(localId);
        if(!transport){
            console.log('consumeAdd: transport x');
            return;
        }
        const rtpCapabilities = data.rtpCapabilities;
        const producereId = data.producereId;

        const producer = getProducer(producereId, kind);
        if(!producer){
            console.log('consumeAdd: producer x');
            return;
        }

        const { consumer, params }: any = await createConsumer(transport, producer, rtpCapabilities);
        addConsumer(localId, producereId, consumer, kind);
        consumer.observer.on('close', () => {
            console.log('consumer closed ---');
        })
        consumer.on('producerclose', () => {
            console.log('consumer -- on.producerclose');
            consumer.close();
            removeConsumer(localId, producereId, kind);

            // -- notify to client  TODO---
            socket.emit('producerClosed', { localId: localId, producereId: producereId, kind: kind });
        });

        callback(params, null);

    });

    socket.on('resumeAdd', async (data: any, callback: any) => {
        const localId = socket.id;
        const producerId = data.producerId;
        const kind = data.kind;
        console.log('-- resumeAdd localId=%s remoteId=%s kind=%s', localId, producerId, kind);
        let consumer = getConsumer(localId, producerId, kind);
        if (!consumer) {
            console.error('consumer NOT EXIST for remoteId=' + producerId);
            callback(null, 'consumer NOT EXIST for remoteId=' + producerId);
        }
        await consumer.resume();
        callback({}, null);
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

const WebRtcTransportOptions: mediaSoupTypes.WebRtcTransportOptions =
{
    listenIps: [
      { ip: '127.0.0.1', announcedIp: '127.0.0.1' }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000,
};

async function startWorker() {
    worker = await createWorker();
    router = await worker.createRouter({mediaCodecs});
    console.log('-- mediasoup worker start. --')
}

async function createTransport(){
    const newTransport: mediaSoupTypes.WebRtcTransport = await router.createWebRtcTransport(WebRtcTransportOptions);

    return{
        transport: newTransport,
        params: {
            id: newTransport.id,
            iceParameters: newTransport.iceParameters,
            iceCandidates: newTransport.iceCandidates,
            dtlsParameters: newTransport.dtlsParameters
        }
    }
}

startWorker();







// --- multi-producers --
let producerTransports: any = {};
let videoProducers: any = {};
let audioProducers: any = {};


function getProducerTrasnport(id: any) {
    return producerTransports[id];
}

function addProducerTrasport(id: any, transport: mediaSoupTypes.WebRtcTransport) {
    producerTransports[id] = transport;
    console.log('producerTransports count=' + Object.keys(producerTransports).length);
}

function removeProducerTransport(id: any) {
    delete producerTransports[id];
    console.log('producerTransports count=' + Object.keys(producerTransports).length);
}


function removeProducer(id: any, kind: any) {
    if (kind === 'video') {
        delete videoProducers[id];
    }
    else if (kind === 'audio') {
        delete audioProducers[id];
    }
    else {
        console.warn('UNKNOWN producer kind=' + kind);
    }
}

function getOtherProducers(localId: any, kind: any) {
    let OtherProducersIds = [];
    if (kind === 'video') {
        for (const key in videoProducers) {
            if (key !== localId) {
                OtherProducersIds.push(key);
            }
        }
    }
    else if (kind === 'audio') {
        for (const key in audioProducers) {
            if (key !== localId) {
                OtherProducersIds.push(key);
            }
        }
    }
    return OtherProducersIds;
}

function getProducer(id: any, kind: any) {

    if (kind === 'video') {
        return videoProducers[id];
    }
    else if (kind === 'audio') {
        return audioProducers[id];
    }
    else {
        console.warn('UNKNOWN producer kind=' + kind);
    }
}

function addProducer(id: any, producer: any, kind: any) {
    if (kind === 'video') {
        videoProducers[id] = producer;
    }
    else if (kind === 'audio') {
        audioProducers[id] = producer;
    }
    else {
        console.warn('UNKNOWN producer kind=' + kind);
    }
}


// --- multi-consumers --
let consumerTransports: any = {};
let videoConsumers: any = {};
let audioConsumers: any = {};

function getConsumerTransport(id: any): mediaSoupTypes.WebRtcTransport{
    return consumerTransports[id];
}

function addConsumerTransport(id: any, transport: mediaSoupTypes.WebRtcTransport){
    consumerTransports[id] = transport;
}

function removeConsumerTransport(id: any){
    delete consumerTransports[id];
}

function getConsumerSet(localId: any, kind: string) {
    if (kind === 'video') {
      return videoConsumers[localId];
    }
    else if (kind === 'audio') {
      return audioConsumers[localId];
    }
    else {
      console.warn('WARN: getConsumerSet() UNKNWON kind=%s', kind);
    }
}

function addConsumerSet(localId: any, set: any, kind: string) {
    if (kind === 'video') {
      videoConsumers[localId] = set;
    }
    else if (kind === 'audio') {
      audioConsumers[localId] = set;
    }
    else {
      console.warn('WARN: addConsumerSet() UNKNWON kind=%s', kind);
    }
}


function getConsumer(localId: any, remoteId: any, kind: string) {
    
    const set = getConsumerSet(localId, kind);
    if (set) {
        return set[remoteId];
    }
    else {
        return null;
    }
}



async function createConsumer(transport: mediaSoupTypes.WebRtcTransport, producer: any, rtpCapabilities: any) {
    let consumer: mediaSoupTypes.Consumer| any;
    if(!router.canConsume({
        producerId: producer.id,
        rtpCapabilities
    })){
        console.log('createConsumer: can not consume!');
        return;
    }

    consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: producer.kind == 'video'
    }).catch((error: any)=>{
        console.log('consume fail', error);
        return;
    });

    return{
        consumer: consumer,
        params: {
            producerId: producer.id,
            id: consumer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused
        }
    }
}

function addConsumer(localId: any, producerId: any, consumer: mediaSoupTypes.Consumer, kind: string){
    const set = getConsumerSet(localId, kind);
    if(set){
        set[producerId] = consumer;
    }
    else{
        const newSet: any = {};
        newSet[producerId] = consumer;
        addConsumerSet(localId, newSet, kind);
    }
}

function removeConsumer(localId: any, producereId: any, kind: string) {
    const set = getConsumerSet(localId, kind);
    if (set) {
        delete set[producereId];
        console.log('consumers kind=%s count=%d', kind, Object.keys(set).length);
    }
    else {
        console.log('NO set for kind=%s, localId=%s', kind, localId);
    }
}


function cleanUpPeer(socket: any) {
    const id = socket.id;
    removeConsumerSetDeep(id);
    /*
    const consumer = getConsumer(id);
    if (consumer) {
      consumer.close();
      removeConsumer(id);
    }
    */
  
    const transport = getConsumerTransport(id);
    if (transport) {
      transport.close();
      removeConsumerTransport(id);
    }
  
    const videoProducer = getProducer(id, 'video');
    if (videoProducer) {
      videoProducer.close();
      removeProducer(id, 'video');
    }
    const audioProducer = getProducer(id, 'audio');
    if (audioProducer) {
      audioProducer.close();
      removeProducer(id, 'audio');
    }
  
    const producerTransport = getProducerTrasnport(id);
    if (producerTransport) {
      producerTransport.close();
      removeProducerTransport(id);
    }
  }

function removeConsumerSetDeep(localId: any) {
    const set = getConsumerSet(localId, 'video');
    delete videoConsumers[localId];
    if (set) {
        for (const key in set) {
            const consumer = set[key];
            consumer.close();
            delete set[key];
        }

        console.log('removeConsumerSetDeep video consumers count=' + Object.keys(set).length);
    }

    const audioSet = getConsumerSet(localId, 'audio');
    delete audioConsumers[localId];
    if (audioSet) {
        for (const key in audioSet) {
            const consumer = audioSet[key];
            consumer.close();
            delete audioSet[key];
        }

        console.log('removeConsumerSetDeep audio consumers count=' + Object.keys(audioSet).length);
    }
}