import http from "http";
import https from "https";
import express from 'express';
import { createWorker, types as mediaSoupTypes } from 'mediasoup';


export function SFUstart(app: express.Application){
    const server = http.createServer(app).listen(serverOptions.listenPort, function () {
        console.log('Web server start. http://' + serverOptions.hostName + ':' + webServer.address().port + '/');
    });
    
}



let serverOptions = {
    hostName: 'localhost',
    listenPort: '3001',
    useHttps: false
};




const app = express();

let webServer : any = null;

if(serverOptions.useHttps){

}
else{
    webServer = http.createServer(app).listen(serverOptions.listenPort, function () {
        console.log('Web server start. http://' + serverOptions.hostName + ':' + webServer.address().port + '/');
    });
}

const io = require('socket.io')(webServer, {path : '/server'});

console.log('socket.io server start. port=' + webServer.address().port);
io.on('connection', (socket : any)=>{
    console.log('client connected. socket id=' + socket.id + '  , total clients=');
 
    
    socket.on('disconnect', ()=>{
        const roomname = getRoomname();
        cleanUpPeer(roomname, socket);
        socket.leave(roomname);
       
    })

    socket.on('prepare_room', async (data: any, callback: any) => {
        const roomId = data.roomId;
        const existRoom = Room.getRoom(roomId);
        if (existRoom) {
            console.log('--- use exist room. roomId=' + roomId);
        } else {
            console.log('--- create new room. roomId=' + roomId);
            await setupRoom(roomId);
        }

        // --- socket.io room ---
        socket.join(roomId);
        setRoomname(roomId);

        callback({}, null);
    })

    socket.on('getRouterRtpCapabilities', (data : any, callback : any) => {
        const roomname = getRoomname();
        const room = Room.getRoom(roomname);
        if(!room){
            callback(null, {text: '[getRouterRtpCapabilities]: there is no room'})
            return;
        }

        if(room.router){
            callback(room.router.rtpCapabilities, null);
        }
        else{
            callback(null, {text: '[getRouterRtpCapabilities]: there is no router'});
        }
    });



    // producer
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    socket.on('createProducerTransport', async (data: any, callback: any) => {
        const roomname = getRoomname();
        
        const { transport, params }: any = await createTransport(roomname);
        addProducerTrasport(roomname, socket.id, transport);
        transport.observer.on('close', () => {
            const id = socket.id;
            const videoProducer = getProducer(roomname, id, 'video');
            if (videoProducer) {
                videoProducer.close();
                removeProducer(roomname, id, 'video');
            }
            const audioProducer = getProducer(roomname, id, 'audio');
            if (audioProducer) {
                audioProducer.close();
                removeProducer(roomname, id, 'audio');
            }
            removeProducerTransport(roomname, id);
        });
        
        callback(params, null);
    });

    socket.on('connectProducerTransport', async (data: any, callback: any) => {
        const roomname = getRoomname();
        const id = socket.id;
        const transport = getProducerTrasnport(roomname, id);
        await transport.connect({ dtlsParameters: data.dtlsParameters });
        callback({}, null);
    });

    socket.on('produce', async (data: any, callback: any) => {
        const roomname = getRoomname();
        const id = socket.id;
        const { kind, rtpParameters } = data;
        const transport = getProducerTrasnport(roomname, id);
        if (!transport) {
            console.error('transport NOT EXIST for id=' + id);
            return;
        }
        const producer = await transport.produce({ kind, rtpParameters });
        addProducer(roomname, id, producer, kind);
        producer.observer.on('close', () => {
            console.log('producer closed --- kind=' + kind);
        })
        callback({ id: producer.id }, null);

        // inform clients about new producer
        console.log('--broadcast newProducer ---');
        socket.broadcast.to(roomname).emit('newProducer', { socketId: id, producerId: producer.id, kind: producer.kind });
    });



    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    // consumer
    socket.on('createConsumerTransport', async(data: any, callback: any) => {
        const roomname = getRoomname();
        console.log('create consumer transport. socket id=' + socket.id);
        const {transport, params}: any = await createTransport(roomname);
        addConsumerTransport(roomname, socket.id, transport);
        transport.observer.on('close', ()=>{
            const id = socket.id;
            removeConsumerSetDeep(roomname, id);
            removeConsumerTransport(roomname, id);
        })

        callback(params, null);
    });

    socket.on('connectConsumerTransport', async(data: any, callback: any) => {
        const roomname = getRoomname();
        let transport = getConsumerTransport(roomname, socket.id);
        if(!transport){
            console.log('There is no consumer transport. socket id=' + socket.id);
            return;
        }
        await transport.connect({dtlsParameters: data.dtlsParameters});
        callback({}, null);
    });

    socket.on('getOtherProducers', async(data: any, callback: any) =>{
        const roomname = getRoomname();
        const clientId = data.localId;
        const otherProducersVideoIds = getOtherProducers(roomname, clientId, 'video');
        const otherProducersAudioIds = getOtherProducers(roomname, clientId, 'audio');

        callback({VideoIds: otherProducersVideoIds, AudioIds: otherProducersAudioIds}, null);
    });

    socket.on('consumeAdd', async(data: any, callback: any) => {
        const roomname = getRoomname();
        const localId = socket.id;
        const kind = data.kind;
        
        let transport = getConsumerTransport(roomname, localId);
        if(!transport){
            console.log('consumeAdd: transport x');
            return;
        }
        const rtpCapabilities = data.rtpCapabilities;
        const producereId = data.producereId;

        const producer = getProducer(roomname, producereId, kind);
        if(!producer){
            console.log('consumeAdd: producer x');
            return;
        }

        const { consumer, params }: any = await createConsumer(roomname, transport, producer, rtpCapabilities);
        addConsumer(roomname, localId, producereId, consumer, kind);
        consumer.observer.on('close', () => {
            console.log('consumer closed ---');
        })
        consumer.on('producerclose', () => {
            console.log('consumer -- on.producerclose');
            consumer.close();
            removeConsumer(roomname, localId, producereId, kind);

            // -- notify to client ---
            socket.emit('producerClosed', { localId: localId, producereId: producereId, kind: kind });
        });

        callback(params, null);

    });

    socket.on('resumeAdd', async (data: any, callback: any) => {
        const roomname = getRoomname();
        const localId = socket.id;
        const producerId = data.producerId;
        const kind = data.kind;
        console.log('-- resumeAdd localId=%s remoteId=%s kind=%s', localId, producerId, kind);
        let consumer = getConsumer(roomname, localId, producerId, kind);
        if (!consumer) {
            console.error('consumer NOT EXIST for remoteId=' + producerId);
            callback(null, 'consumer NOT EXIST for remoteId=' + producerId);
            return;
        }
        await consumer.resume();
        callback({}, null);
    });

    


    function setRoomname(room: string) {
        socket.roomname = room;
    }

    function getRoomname() {
        const room = socket.roomname;
        return room;
    }
    
    socket.emit('socketConnection-finish', {type: 'finish', id: socket.id});
})





async function createTransport(roomname: string){
    const room = Room.getRoom(roomname);
    if(!room){
        console.log('[createTransport]: there is no room');
        return;
    }

    const router = room.router;
    if(!router){
        console.log('[createTransport]: there is no router');
        return;
    }

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





// --- multi-consumers --


function getProducerTrasnport(roomname: string, id: any) {
    const room = Room.getRoom(roomname);
    return room.getProducerTrasnport(id);
}

function addProducerTrasport(roomname: string, id: any, transport: mediaSoupTypes.WebRtcTransport) {
    const room = Room.getRoom(roomname);
    if (room) {
        room.addProducerTrasport(id, transport);
        console.log('=== addProducerTrasport use room=%s ===', roomname);
      }
      else {
        console.log('[addProducerTrasport]: there is no room')
      }
}

function removeProducerTransport(roomname: string, id: any) {
    const room = Room.getRoom(roomname);
    room.removeProducerTransport(id);
}


function removeProducer(roomname: string, id: any, kind: any) {
    const room = Room.getRoom(roomname);
    room.removeProducer(id, kind);
}

function getOtherProducers(roomname: string, clientId: any, kind: any) {
    const room = Room.getRoom(roomname);
    return room.getRemoteIds(clientId, kind);
}

function getProducer(roomname: string, id: any, kind: any) {
    const room = Room.getRoom(roomname);
    return room.getProducer(id, kind);
}

function addProducer(roomname: string, id: any, producer: any, kind: any) {
    const room = Room.getRoom(roomname);
    room.addProducer(id, producer, kind);
}


// --- multi-consumers --

function getConsumerTransport(roomname: string, id: any): mediaSoupTypes.WebRtcTransport{
    const room = Room.getRoom(roomname);
    return room.getConsumerTrasnport(id);
}

function addConsumerTransport(roomname: string, id: any, transport: mediaSoupTypes.WebRtcTransport){
    const room = Room.getRoom(roomname);
    room.addConsumerTrasport(id, transport);
}

function removeConsumerTransport(roomname: any, id: any){
    const room = Room.getRoom(roomname);
    room.removeConsumerTransport(id);
}


function getConsumer(roomname: any, localId: any, remoteId: any, kind: string) {
    const room = Room.getRoom(roomname);
    return room.getConsumer(localId, remoteId, kind);
}



async function createConsumer(roomname: any, transport: mediaSoupTypes.WebRtcTransport, producer: any, rtpCapabilities: any) {
    const room = Room.getRoom(roomname);
    const router: any = room.router;
    
    if(!router.canConsume({
        producerId: producer.id,
        rtpCapabilities
    })){
        console.log('[createConsumer]: can not consume!');
        return;
    }

    const consumer: any = await transport.consume({
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

function addConsumer(roomname: any, localId: any, producerId: any, consumer: mediaSoupTypes.Consumer, kind: string){
    const room = Room.getRoom(roomname);
    room.addConsumer(localId, producerId, consumer, kind);
}

function removeConsumer(roomname: any, localId: any, producereId: any, kind: string) {
    const room = Room.getRoom(roomname);
    room.removeConsumer(localId, producereId, kind);
}


function cleanUpPeer(roomname: any, socket: any) {
    const id = socket.id;
    removeConsumerSetDeep(roomname, id);
  
    const transport = getConsumerTransport(roomname, id);
    if (transport) {
      transport.close();
      removeConsumerTransport(roomname, id);
    }
  
    const videoProducer = getProducer(roomname, id, 'video');
    if (videoProducer) {
      videoProducer.close();
      removeProducer(roomname, id, 'video');
    }
    const audioProducer = getProducer(roomname, id, 'audio');
    if (audioProducer) {
      audioProducer.close();
      removeProducer(roomname, id, 'audio');
    }
  
    const producerTransport = getProducerTrasnport(roomname, id);
    if (producerTransport) {
      producerTransport.close();
      removeProducerTransport(roomname, id);
    }
  }

function removeConsumerSetDeep(roomname: any, localId: any) {
    const room = Room.getRoom(roomname);
    room.removeConsumerSetDeep(localId);
}





class Room {

    name: string;
    producerTransports: {[key: string]: mediaSoupTypes.WebRtcTransport};
    videoProducers: {[key: string]: mediaSoupTypes.Producer};
    audioProducers: {[key: string]: mediaSoupTypes.Producer};
    consumerTransports: {[key: string]: mediaSoupTypes.WebRtcTransport};
    videoConsumerSets: {[key: string]: {[key: string]: mediaSoupTypes.Consumer}};
    audioConsumerSets: {[key: string]: {[key: string]: mediaSoupTypes.Consumer}};
    router: mediaSoupTypes.Router| null;

    static rooms: {[key: string]: Room} = {};

    constructor(name: string){
        this.name = name;
        this.producerTransports = {};
        this.videoProducers = {};
        this.audioProducers = {};
        this.consumerTransports = {};
        this.videoConsumerSets = {};
        this.audioConsumerSets = {};
        this.router = null;
    }

    // producer transport
    getProducerTrasnport(id: string) {
        return this.producerTransports[id];
    }

    addProducerTrasport(id: string, transport: mediaSoupTypes.WebRtcTransport) {
        this.producerTransports[id] = transport;
        console.log('room=%s producerTransports count=%d', this.name, Object.keys(this.producerTransports).length);
    }

    removeProducerTransport(id: string) {
        delete this.producerTransports[id];
        console.log('room=%s producerTransports count=%d', this.name, Object.keys(this.producerTransports).length);
    }

    // producer
    addProducer(id: string, producer: mediaSoupTypes.Producer, kind: string) {
        if (kind === 'video') {
            this.videoProducers[id] = producer;
            console.log('room=%s videoProducers count=%d', this.name, Object.keys(this.videoProducers).length);
        }
        else if (kind === 'audio') {
            this.audioProducers[id] = producer;
            console.log('room=%s videoProducers count=%d', this.name, Object.keys(this.audioProducers).length);
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    removeProducer(id: string, kind: string) {
        if (kind === 'video') {
            delete this.videoProducers[id];
            console.log('videoProducers count=' + Object.keys(this.videoProducers).length);
        }
        else if (kind === 'audio') {
            delete this.audioProducers[id];
            console.log('audioProducers count=' + Object.keys(this.audioProducers).length);
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    getRemoteIds(clientId: string, kind: string) {
        let producerIds = [];
        if (kind === 'video') {
            for (const key in this.videoProducers) {
                if (key !== clientId) {
                    producerIds.push(key);
                }
            }
        }
        else if (kind === 'audio') {
            for (const key in this.audioProducers) {
                if (key !== clientId) {
                    producerIds.push(key);
                }
            }
        }
        return producerIds;
    }

    getProducer(id: string, kind: string) {
        if (kind === 'video') {
            return this.videoProducers[id];
        }
        else if (kind === 'audio') {
            return this.audioProducers[id];
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    // consumer transport
    getConsumerTrasnport(id: any) {
        return this.consumerTransports[id];
    }

    addConsumerTrasport(id: any, transport: mediaSoupTypes.WebRtcTransport) {
        this.consumerTransports[id] = transport;
        console.log('room=%s add consumerTransports count=%d', this.name, Object.keys(this.consumerTransports).length);
    }

    removeConsumerTransport(id: any) {
        delete this.consumerTransports[id];
        console.log('room=%s remove consumerTransports count=%d', this.name, Object.keys(this.consumerTransports).length);
    }

    // consumer set
    getConsumerSet(localId: any, kind: string) {
        if (kind === 'video') {
            return this.videoConsumerSets[localId];
        }
        else if (kind === 'audio') {
            return this.audioConsumerSets[localId];
        }
        else {
            console.warn('WARN: getConsumerSet() UNKNWON kind=%s', kind);
        }
    }

    addConsumerSet(localId: any, set: any, kind: string) {
        if (kind === 'video') {
            this.videoConsumerSets[localId] = set;
        }
        else if (kind === 'audio') {
            this.audioConsumerSets[localId] = set;
        }
        else {
            console.warn('WARN: addConsumerSet() UNKNWON kind=%s', kind);
        }
    }

    removeConsumerSetDeep(localId: any) {
        const videoSet = this.getConsumerSet(localId, 'video');
        delete this.videoConsumerSets[localId];
        if (videoSet) {
            for (const key in videoSet) {
                const consumer = videoSet[key];
                consumer.close();
                delete videoSet[key];
            }

            console.log('room=%s removeConsumerSetDeep video consumers count=%d', this.name, Object.keys(videoSet).length);
        }

        const audioSet = this.getConsumerSet(localId, 'audio');
        delete this.audioConsumerSets[localId];
        if (audioSet) {
            for (const key in audioSet) {
                const consumer = audioSet[key];
                consumer.close();
                delete audioSet[key];
            }

            console.log('room=%s removeConsumerSetDeep audio consumers count=%d', this.name, Object.keys(audioSet).length);
        }
    }


    // consumer
    addConsumer(localId: any, remoteId: any, consumer: mediaSoupTypes.Consumer, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            set[remoteId] = consumer;
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, Object.keys(set).length);
        }
        else {
            console.log('room=%s new set for kind=%s, localId=%s', this.name, kind, localId);
            const newSet: any = {};
            newSet[remoteId] = consumer;
            this.addConsumerSet(localId, newSet, kind);
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, Object.keys(newSet).length);
        }
    }

    removeConsumer(localId: any, remoteId: any, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            delete set[remoteId];
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, Object.keys(set).length);
        }
        else {
            console.log('NO set for room=%s kind=%s, localId=%s', this.name, kind, localId);
        }
    }

    getConsumer(localId: any, remoteId: any, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            return set[remoteId];
        }
        else {
            return null;
        }
    }


    static addRoom(room: Room, name: string) {
        Room.rooms[name] = room;
        console.log('static addRoom. name=%s', room.name);
    }

    static getRoom(name: string) {
        return Room.rooms[name];
    }

    static removeRoom(name: string) {
        delete Room.rooms[name];
    }

}

async function setupRoom(name: any) {
    const room = new Room(name);
    const router = await worker.createRouter({ mediaCodecs });
  

    router.observer.on('close', () => {
        console.log('-- router closed. room=%s', name);
    });
    router.observer.on('newtransport', transport => {
        console.log('-- router newtransport. room=%s', name);
    });

    room.router = router;
    Room.addRoom(room, name);
    return room;
}






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
    try{
        worker = await createWorker();
    }
    catch (error){
        console.log("createWorker failed");
    }
    
    
    console.log('-- mediasoup worker start. --')
}

startWorker();

