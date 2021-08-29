
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

    static rooms = new Map<string, Room>();

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
        return this.producerTransports.get(id);
    }

    addProducerTrasport(id: string, transport: mediaSoupTypes.WebRtcTransport) {
        this.producerTransports.set(id, transport);
        console.log('room=%s producerTransports count=%d', this.name, this.producerTransports.size);
    }

    removeProducerTransport(id: string) {
        this.producerTransports.delete(id);
        console.log('room=%s producerTransports count=%d', this.name, this.producerTransports.size);
    }

    // producer
    addProducer(id: string, producer: mediaSoupTypes.Producer, kind: string) {
        if (kind === 'video') {
            this.videoProducers.set(id, producer);
            console.log('room=%s videoProducers count=%d', this.name, this.videoProducers.size);
        }
        else if (kind === 'audio') {
            this.audioProducers.set(id, producer);
            this.audioProducers.get(id).pause();
            console.log('room=%s videoProducers count=%d', this.name, this.audioProducers.size);
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    removeProducer(id: string, kind: string) {
        if (kind === 'video') {
            this.videoProducers.delete(id);
            console.log('videoProducers count=' + this.videoProducers.size);
        }
        else if (kind === 'audio') {
            this.audioProducers.delete(id);
            console.log('audioProducers count=' + this.audioProducers.size);
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    getRemoteIds(clientId: string, kind: string) {
        let producerIds = [];
        if (kind === 'video') {
            for (const key of this.videoProducers.keys()) {
                if (key !== clientId) {
                    producerIds.push(key);
                }
            }
        }
        else if (kind === 'audio') {
            for (const key of this.audioProducers.keys()) {
                if (key !== clientId) {
                    producerIds.push(key);
                }
            }
        }
        return producerIds;
    }

    getProducer(id: string, kind: string) {
        if (kind === 'video') {
            return this.videoProducers.get(id);
        }
        else if (kind === 'audio') {
            return this.audioProducers.get(id);
        }
        else {
            console.warn('UNKNOWN producer kind=' + kind);
        }
    }

    // consumer transport
    getConsumerTrasnport(id: any) {
        return this.consumerTransports.get(id);
    }

    addConsumerTrasport(id: any, transport: mediaSoupTypes.WebRtcTransport) {
        this.consumerTransports.set(id, transport)
        console.log('room=%s add consumerTransports count=%d', this.name, this.consumerTransports.size);
    }

    removeConsumerTransport(id: any) {
        this.consumerTransports.delete(id);
        console.log('room=%s remove consumerTransports count=%d', this.name, this.consumerTransports.size);
    }

    // consumer set
    getConsumerSet(localId: any, kind: string) {
        if (kind === 'video') {
            return this.videoConsumerSets.get(localId);
        }
        else if (kind === 'audio') {
            return this.audioConsumerSets.get(localId);
        }
        else {
            console.warn('WARN: getConsumerSet() UNKNWON kind=%s', kind);
        }
    }

    addConsumerSet(localId: any, set: any, kind: string) {
        if (kind === 'video') {
            this.videoConsumerSets.set(localId, set);
        }
        else if (kind === 'audio') {
            this.audioConsumerSets.set(localId, set);
        }
        else {
            console.warn('WARN: addConsumerSet() UNKNWON kind=%s', kind);
        }
    }

    removeConsumerSetDeep(localId: any) {
        const videoSet = this.getConsumerSet(localId, 'video');
        this.videoConsumerSets.delete(localId);
        if (videoSet) {
            for (const key of videoSet.keys()){
                const consumer = videoSet.get(key);
                consumer.close();
                videoSet.delete(key);
            }

            console.log('room=%s removeConsumerSetDeep video consumers count=%d', this.name, videoSet.size);
        }

        const audioSet = this.getConsumerSet(localId, 'audio');
        this.audioConsumerSets.delete(localId);
        if (audioSet) {
            for (const key of audioSet.keys()) {
                const consumer = audioSet.get(key);
                consumer.close();
                audioSet.delete(key);
            }

            console.log('room=%s removeConsumerSetDeep audio consumers count=%d', this.name, audioSet.size);
        }
    }


    // consumer
    addConsumer(localId: any, remoteId: any, consumer: mediaSoupTypes.Consumer, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            set.set(remoteId, consumer);
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, set.size);
        }
        else {
            console.log('room=%s new set for kind=%s, localId=%s', this.name, kind, localId);
            const newSet = new Map<string, mediaSoupTypes.Consumer>();
            newSet.set(remoteId, consumer);
            this.addConsumerSet(localId, newSet, kind);
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, newSet.size);
        }
    }

    removeConsumer(localId: any, remoteId: any, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            set.delete(remoteId);
            console.log('room=%s consumers kind=%s count=%d', this.name, kind, set.size);
        }
        else {
            console.log('NO set for room=%s kind=%s, localId=%s', this.name, kind, localId);
        }
    }

    getConsumer(localId: any, remoteId: any, kind: string) {
        const set = this.getConsumerSet(localId, kind);
        if (set) {
            return set.get(remoteId);
        }
        else {
            return null;
        }
    }



    // members
    addMember(userName: string, socketid: string) {
        this.Members.set(userName, socketid);
    }

    removeMember(userName: string) {
        this.Members.delete(userName);
    }




    static addRoom(room: Room, url: string) {
        Room.rooms.set(url, room);
        console.log('static addRoom. name=%s', room.name);
    }

    static getRoom(url: string): Room {
        return Room.rooms.get(url);
    }

    static removeRoom(url: string) {
        Room.rooms.delete(url);
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