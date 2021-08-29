import { Device, types as mediaSoupTypes } from "mediasoup-client";
import React from "react";
import { Socket } from "socket.io-client";
import { SocketConnect } from '../SocketConnect/SocketConnect';
import { userVideo } from '../@type/index';


export class Subsribe {
    public consumerTransport!: mediaSoupTypes.Transport;
    public videoConsumers = new Map<string, mediaSoupTypes.Consumer>();
    public audioConsumers = new Map<string, mediaSoupTypes.Consumer>();
    public device: Device;
    public socketConnect: SocketConnect;
    public userVideos: userVideo[] = [];
    public mediaStreams: any = {};



    constructor(device: Device, socketConnect: SocketConnect) {
        this.device = device;
        this.socketConnect = socketConnect;
    }


    async subscribe() {
        const params = await this.socketConnect.sendRequest('createConsumerTransport', { });
        this.consumerTransport = this.device.createRecvTransport(params);

        this.consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            console.log('--consumer trasnport connect');
            this.socketConnect.sendRequest('connectConsumerTransport', { dtlsParameters: dtlsParameters })
                .then(callback)
                .catch(errback);
        });

        this.consumerTransport.on('connectionstatechange', (state) => {
            switch (state) {
                case 'connecting':
                    console.log('subscribing...');
                    break;

                case 'connected':
                    console.log('subscribed');
                    break;

                case 'failed':
                    console.log('failed');
                    this.consumerTransport.close();
                    break;

                default:
                    console.log('뭐꼬 이건');
                    break;
            }
        });

        this.consumeOtherProducers(this.socketConnect.socketId);
    }


    async consumeOtherProducers(socketId: string) {
        const otherProducers = await this.socketConnect.sendRequest('getOtherProducers', { localId: socketId })
            .catch((error: any) => {
                console.log('getOtherProducers error', error);
                return;
            });
        const videoIds = otherProducers.VideoIds;
        const audioIds = otherProducers.AudioIds;
        console.log('otherProducers', otherProducers);

        videoIds.forEach((vid: any) => {
            this.consumeAdd(this.consumerTransport, vid, null, 'video');
        });

        audioIds.forEach((aid: any) => {
            this.consumeAdd(this.consumerTransport, aid, null, 'audio');
        });
    };


    async consumeAdd(consumerTransport: mediaSoupTypes.Transport, producerSocketId: any, prdId: any, tkind: string) {
        const { rtpCapabilities } = this.device;
        const data = await this.socketConnect.sendRequest('consumeAdd', { rtpCapabilities: rtpCapabilities, producereId: producerSocketId, kind: tkind })
            .catch((err: any) => {
                console.log('consumeAdd error', err);
            });

        if (prdId && (prdId !== producerSocketId)) {
            console.warn('producerID NOT MATCH');
        }

        const id = data.id;
        const producerId = data.producerId;
        const rtpParameters = data.rtpParameters;
        const kind = data.kind;

        let codecOptions: any = {};
        const consumer = await consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
        });
        // TODO VIDEO
        this.addSubVideo(producerSocketId, consumer.track, kind);
        this.addConsumer(producerSocketId, consumer, kind);

        consumer.on("producerclose", () => {
            console.log('--consumer producer closed. remoteId=' + consumer.producerId);
            consumer.close();
            this.removeConsumer(producerId, kind);
            this.removeRemoteVideo(consumer.producerId);
        });


        if (kind === 'video') {
            console.log('--try resumeAdd --');
            this.socketConnect.sendRequest('resumeAdd', { producerId: producerSocketId, kind: kind })
                .then(() => {
                    console.log('resumeAdd OK');
                })
                .catch((err: any) => {
                    console.error('resumeAdd ERROR:', err);
                });
        }


    }


    addConsumer(id: string, consumer: mediaSoupTypes.Consumer, kind: string) {
        if (kind === 'video') {
            this.videoConsumers.set(id, consumer);
            console.log('videoConsumers count=' + this.videoConsumers.size);
        }
        else if (kind === 'audio') {
            this.audioConsumers.set(id, consumer);
            console.log('audioConsumers count=' + this.audioConsumers.size);
        }
        else {
            console.warn('UNKNOWN consumer kind=' + kind);
        }
    }

    async addSubVideo(producerSocketId: any, track: any, kind: any) {
        
        let isExist = 0;
        
        this.userVideos =  this.userVideos.map((uv) => {
                if(uv.producerId == producerSocketId){
                    uv.stream.addTrack(track);
                    isExist = 1;
                }
                return uv;
            })
        

        if(isExist == 0){
            const newMedia = new MediaStream();
            newMedia.addTrack(track);
            this.userVideos = [...this.userVideos, {
                producerId: producerSocketId,
                userName: "",
                stream: newMedia
            }]
        }
        
        // console.log("###########", kind);
        // let stream = this.mediaStreams[producerSocketId];
        // if(!stream){
        //     console.log("@@@@@@@@@@@", kind);
        //     this.mediaStreams[producerSocketId] = new MediaStream();
        //     await this.mediaStreams[producerSocketId].addTrack(track);
            
        // }
        // else{
        //     console.log("!!!!!!!!!!!!!!", kind);
        //     await this.mediaStreams[producerSocketId].addTrack(track);
        //     const newVideo: userVideo = {
        //         userName: "",
        //         producerId: producerSocketId,
        //         stream: this.mediaStreams[producerSocketId]
        //     }
        //     this.setUserVideos(oldItems => [...oldItems, newVideo]);
        //     delete this.mediaStreams[producerSocketId];
        // }

    }


    removeConsumer(id: any, kind: any) {
        if (kind === 'video') {
            this.videoConsumers.delete(id);
            console.log('videoConsumers count=' + this.videoConsumers.size);
        }
        else if (kind === 'audio') {
            this.audioConsumers.delete(id);
            console.log('audioConsumers count=' + this.audioConsumers.size);
        }
        else {
            console.warn('UNKNOWN consumer kind=' + kind);
        }
    }


    removeRemoteVideo(id: string) {
        console.log(' ---- removeRemoteVideo() id=' + id);
        
        this.userVideos = this.userVideos.filter((userVideo) => userVideo.producerId !== id);
       
    }

    

}