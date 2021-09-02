import { createWorker, types as mediaSoupTypes } from 'mediasoup';
import { Room } from '../room/room';


export async function createTransport(roomname: string){
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


export function getProducerTrasnport(roomname: string, id: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    return room.getProducerTrasnport(id);
}

export function addProducerTrasport(roomname: string, id: any, transport: mediaSoupTypes.WebRtcTransport) {
    const room = Room.getRoom(roomname);
    if (room) {
        room.addProducerTrasport(id, transport);
        console.log('=== addProducerTrasport use room=%s ===', roomname);
      }
      else {
        console.log('[addProducerTrasport]: there is no room')
      }
}

export function removeProducerTransport(roomname: string, id: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeProducerTransport(id);
}


export function removeProducer(roomname: string, id: any, kind: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeProducer(id, kind);
}

export function getOtherProducers(roomname: string, clientId: any, kind: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    return room.getRemoteIds(clientId, kind);
}

export function getProducer(roomname: string, id: any, kind: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    return room.getProducer(id, kind);
}

export function addProducer(roomname: string, id: any, producer: any, kind: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.addProducer(id, producer, kind);
}


// --- multi-consumers --

export function getConsumerTransport(roomname: string, id: any): mediaSoupTypes.WebRtcTransport{
    const room = Room.getRoom(roomname);
    if(!room) return;
    return room.getConsumerTrasnport(id);
}

export function addConsumerTransport(roomname: string, id: any, transport: mediaSoupTypes.WebRtcTransport){
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.addConsumerTrasport(id, transport);
}

export function removeConsumerTransport(roomname: any, id: any){
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeConsumerTransport(id);
}


export function getConsumer(roomname: any, localId: any, remoteId: any, kind: string) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    return room.getConsumer(localId, remoteId, kind);
}



export async function createConsumer(roomname: any, transport: mediaSoupTypes.WebRtcTransport, producer: any, rtpCapabilities: any) {
    const room = Room.getRoom(roomname);
    if(!room) return;
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

export function addConsumer(roomname: any, localId: any, producerId: any, consumer: mediaSoupTypes.Consumer, kind: string){
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.addConsumer(localId, producerId, consumer, kind);
}

export function removeConsumer(roomname: any, localId: any, producereId: any, kind: string) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeConsumer(localId, producereId, kind);
}

export function removeMember(roomname: string, socketid: string) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeMember(socketid);
}

function checkEmpty(roomname: string){
    const room = Room.getRoom(roomname);
    if(!room) return;
    if(Object.keys(room.Members).length == 0){
        Room.removeRoom(roomname);
    }
}

export function cleanUpPeer(roomname: any, socket: any) {
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

    removeMember(roomname, id);

    checkEmpty(roomname);
}

export function removeConsumerSetDeep(roomname: string, localId: string) {
    const room = Room.getRoom(roomname);
    if(!room) return;
    room.removeConsumerSetDeep(localId);
}


export function getOhterMembers(roomname: string) {
    const room = Room.getRoom(roomname);
    return room.Members;
}








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


