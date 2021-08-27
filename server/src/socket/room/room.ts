
import { createWorker, types as mediaSoupTypes } from 'mediasoup';
import { getNextWorker } from '../worker/worker'
// export const rooms = new Map<string, Room>();


export class Room {

    name: string;
    url: string;
    hostEmail: string;
    limitMembers: number;
    producerTransports: Map<string, mediaSoupTypes.WebRtcTransport>;
    videoProducers: Map<string, mediaSoupTypes.Producer>;
    audioProducers: Map<string, mediaSoupTypes.Producer>;
    consumerTransports: Map<string, mediaSoupTypes.WebRtcTransport>;
    videoConsumerSets: Map<string, Map<string, mediaSoupTypes.Consumer>>;
    audioConsumerSets: Map<string, Map<string, mediaSoupTypes.Consumer>>;
    Members: Map<string, string>; 
    date: string;
    router: mediaSoupTypes.Router | null;

    static rooms: Map<string, Room>;

    constructor(name: string, url: string, hostEmail: string, limitMembers: number) {
        this.name = name;
        this.url = url;
        this.hostEmail = hostEmail;
        this.limitMembers = limitMembers;
        this.producerTransports = new Map<string, mediaSoupTypes.WebRtcTransport>();
        this.videoProducers = new Map<string, mediaSoupTypes.Producer>();
        this.audioProducers = new Map<string, mediaSoupTypes.Producer>();
        this.consumerTransports = new Map<string, mediaSoupTypes.WebRtcTransport>();
        this.videoConsumerSets = new Map<string, Map<string, mediaSoupTypes.Consumer>>();
        this.audioConsumerSets = new Map<string, Map<string, mediaSoupTypes.Consumer>>();
        this.Members = new Map<string, string>();
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



    // members
    addMember(userName: string, socketid: string) {
        this.Members[userName] = socketid;
    }

    removeMember(userName: string) {
        delete this.Members[userName];
    }




    static addRoom(room: Room, url: string) {
        Room.rooms[url] = room;
        console.log('static addRoom. name=%s', room.name);
    }

    static getRoom(url: string): Room {
        return Room.rooms[url];
    }

    static removeRoom(url: string) {
        delete Room.rooms[url];
    }

}


export async function setupRoom(name: string, url: string, hostEmail: string, limitMembers: number) {
    const room = new Room(name, url, hostEmail, limitMembers);
    const worker = getNextWorker();
    const router = await worker.createRouter({ mediaCodecs });
  

    router.observer.on('close', () => {
        console.log('-- router closed. room=%s', name);
    });
    router.observer.on('newtransport', transport => {
        console.log('-- router newtransport. room=%s', name);
    });

    room.router = router;
    Room.addRoom(room, url);
    return room;
}


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