import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import {io, Socket} from 'socket.io-client';
import { Subsribe } from '../Subscribe/Subscribe';

const hostname = 'localhost';
const hostport = '3001';

export class SocketConnect {
    public socket: Socket;
    public socketId: string = '';
    public roomUrl: string;
    public subscribe!: Subsribe;
    public user: any;

    constructor(url: string, user:any) {
        const serverUrl = `http://${hostname}:${hostport}`;
        const opts = {
            path: '/server',
            transports: ['websocket'],
        };
        this.user = user;
        this.socket = io(serverUrl, opts);
        this.roomUrl = url;
    }

    setSubscribe(subscribe: Subsribe) {
        this.subscribe = subscribe;
    }

    connectSocket() {
        return new Promise((resolve, reject) => {
           
            this.socket.on('connect', () => {
                this.sendRequest('userEmail', {email: this.user.email})

            });

            this.socket.on('error', (err: any) => {
                console.error('socket.io ERROR:', err);
                reject(err);
            });

            this.socket.on('disconnect', (evt: any) => {
                console.log('socket.io disconnect:', evt);
            });

            // this.socket.on('newConnection', () => {
            //     this.socket.close();
            //     reject('새로운 접속이 확인됐습니다.')
            // });

            this.socket.on('socketConnection-finish', async (message: { type: string, id: any }) => {      
                
                
                await this.sendRequest('prepare_room', {roomId: this.roomUrl, userName: this.user.name})
                    .then(() => {
                        console.log('prepare room : ', this.roomUrl);
                    })
                    .catch((error: any) => {
                        if(error.type == 'exceed'){
                            this.socket.close();
                            reject('인원수가 초과한 방입니다!')
                        }
                        if(error.type == 'empty'){
                            this.socket.close();
                            reject('존재하지 않는 방입니다!')
                        }
                    });

                
                console.log('socketConnection-finish', message);
                if (message.type === 'finish') {
                    if (this.socket.id !== message.id) {
                        console.warn('WARN: socket-client != socket-server', this.socket.id, message.id);
                    }

                    console.log('connected to server. clientId=' + message.id);
                    this.socketId = message.id;
                    resolve(null);
                }
                else {
                    console.error('UNKNOWN message from server:', message);
                }
            });

            this.socket.on('newProducer',  (message: any) => {
                console.log('socket.io newProducer:', message);
                const remoteId = message.socketId;
                const prdId = message.producerId;
                const kind = message.kind;
                const userName =message.userName;
                if (kind === 'video') {
                    console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
                    this.subscribe.consumeAdd(this.subscribe.consumerTransport, remoteId, userName, kind);
                }
                else if (kind === 'audio') {
                    console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
                    this.subscribe.consumeAdd(this.subscribe.consumerTransport, remoteId, userName, kind);
                }
            });

            this.socket.on('producerClosed', (message: any) => {
                console.log('socket.io producerClosed:', message);
                const localId = message.localId;
                const producereId = message.producereId;
                const kind = message.kind;
                console.log('--try removeConsumer remoteId=%s, localId=%s, track=%s', producereId, localId, kind);
                this.subscribe.removeConsumer(producereId, kind);
                this.subscribe.removeRemoteVideo(producereId);
            })

            this.socket.on('producerAudioOff', (message: any) => {
                const producerId = message.producerId;
                
                this.subscribe.userVideos = this.subscribe.userVideos.map((uv) => {
                    if(uv.producerId == producerId){
                        uv.muted = true;
                    }
                    return uv;
                });
            });

            this.socket.on('producerAudioOn', (message: any) => {
                const producerId = message.producerId;
                
                this.subscribe.userVideos = this.subscribe.userVideos.map((uv) => {
                    if(uv.producerId == producerId){
                        uv.muted = false;
                    }
                    return uv;
                });
            });

            this.socket.on('producerVideoOff', (message: any) => {
                const producerId = message.producerId;
                
                this.subscribe.userVideos = this.subscribe.userVideos.map((uv) => {
                    if(uv.producerId == producerId){
                        uv.videoOn = false;
                    }
                    return uv;
                });
            });

            this.socket.on('producerVideoOn', (message: any) => {
                const producerId = message.producerId;
                
                this.subscribe.userVideos = this.subscribe.userVideos.map((uv) => {
                    if(uv.producerId == producerId){
                        uv.videoOn = true;
                    }
                    return uv;
                });
            });

        })
    }


    sendRequest(type: string, data: any): any {
        console.log('[sendRequest]', type);
        return new Promise((resolve, reject) => {
            this.socket.emit(type, data, (respond: any, err: any) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(respond);
                }
            })
        })
    }



}   