import http from "http";
import https from "https";
import express from 'express';
import { createWorker, types as mediaSoupTypes } from 'mediasoup';
import { Server } from 'socket.io';
import { RedisClient } from 'redis';
import config from 'config';
import { Room } from './room/room';
import { cleanUpPeer, createConsumer, createTransport, addConsumer, addConsumerTransport,
addProducer, addProducerTrasport, getConsumer, getConsumerTransport, getOtherProducers,
getProducer, getProducerTrasnport, removeConsumer, removeConsumerSetDeep,removeProducer,
removeConsumerTransport, removeProducerTransport } from './request/requests';


export function run(app: express.Application){

    //const redisClient: RedisClient = app.get('redisClient');
    let server: http.Server | https.Server;
    const serverOptions: any = config.get('SFUoptions');

    if(serverOptions.useHttps) {
        // TODO HTTPS
    } else {
        server = http.createServer(app).listen(serverOptions.listenPort, function () {
            console.log('Web server start. http://' + serverOptions.hostName + ':' + serverOptions.listenPort + '/');
        });
    }
    
    const io = new Server(server, {path : '/server'});
    app.set('io', io);
    console.log('socket.io server start. port=' + serverOptions.listenPort);

    io.on('connection', (socket: any) => {
        console.log('client connected. socket id=' + socket.id + '  , total clients=');
        
        


        socket.on('disconnect', () => {
            const roomname = socket.roomId;
            const userEmail = socket.email;

            cleanUpPeer(roomname, socket);
            socket.leave(roomname);
            socket.leave(userEmail);

        })

        socket.on('userEmail', (data: any, callback: any) => {
            const userEmail = data.email;
            
            if(!userEmail){
                callback(null, { text: '[userEmail] userEmail was not sent'});
            }
        
            // 타 연결 해제
            io.in(userEmail).emit('newConnection');
            
            // user socket 등록
            socket.email = userEmail;
            socket.join(userEmail);

            callback({}, null);
            
        });

        socket.on('prepare_room', async (data: any, callback: any) => {
            const roomId = data.roomId;
            const userName = data.userName;

            socket.userName = userName;
            socket.roomId = roomId;

            const existRoom = Room.getRoom(roomId);

            if(!existRoom) {
                callback(null, { text: '[prepare_room] empty!', type:'empty'});
                return;
            }
                
            if (existRoom.limitMembers <= existRoom.Members.size) {
                callback(null, { text: '[prepare_room] exceed!', type: 'exceed' });
                return;
            }

            //console.log('--- use exist room. roomId=' + roomId);

            // --- socket.io room ---
            socket.join(roomId);
            setRoomname(roomId);
            existRoom.addMember(userName, socket.id);

            callback({}, null);
        });

        socket.on('getRouterRtpCapabilities', (data: any, callback: any) => {
            const roomname = getRoomname();
            const room = Room.getRoom(roomname);
            if (!room) {
                callback(null, { text: '[getRouterRtpCapabilities]: there is no room' })
                return;
            }

            if (room.router) {
                callback(room.router.rtpCapabilities, null);
            }
            else {
                callback(null, { text: '[getRouterRtpCapabilities]: there is no router' });
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
        socket.on('createConsumerTransport', async (data: any, callback: any) => {
            const roomname = getRoomname();
            console.log('create consumer transport. socket id=' + socket.id);
            const { transport, params }: any = await createTransport(roomname);
            addConsumerTransport(roomname, socket.id, transport);
            transport.observer.on('close', () => {
                const id = socket.id;
                removeConsumerSetDeep(roomname, id);
                removeConsumerTransport(roomname, id);
            })

            callback(params, null);
        });

        socket.on('connectConsumerTransport', async (data: any, callback: any) => {
            const roomname = getRoomname();
            let transport = getConsumerTransport(roomname, socket.id);
            if (!transport) {
                console.log('There is no consumer transport. socket id=' + socket.id);
                return;
            }
            await transport.connect({ dtlsParameters: data.dtlsParameters });
            callback({}, null);
        });

        socket.on('getOtherProducers', async (data: any, callback: any) => {
            const roomname = getRoomname();
            const clientId = data.localId;
            const otherProducersVideoIds = getOtherProducers(roomname, clientId, 'video');
            const otherProducersAudioIds = getOtherProducers(roomname, clientId, 'audio');

            callback({ VideoIds: otherProducersVideoIds, AudioIds: otherProducersAudioIds }, null);
        });

        socket.on('consumeAdd', async (data: any, callback: any) => {
            const roomname = getRoomname();
            const localId = socket.id;
            const kind = data.kind;

            let transport = getConsumerTransport(roomname, localId);
            if (!transport) {
                console.log('consumeAdd: transport x');
                return;
            }
            const rtpCapabilities = data.rtpCapabilities;
            const producereId = data.producereId;

            const producer = getProducer(roomname, producereId, kind);
            if (!producer) {
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

        socket.emit('socketConnection-finish', { type: 'finish', id: socket.id });
    })
    
    
}



