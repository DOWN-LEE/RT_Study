import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import {io, Socket} from 'socket.io-client';


const hostname = 'localhost';
const hostport = '3001';

export class SocketConnect {
    public socket: Socket;
    public socketId: string = '';
    public roomUrl: string;

    constructor(url: string) {
        const serverUrl = `http://${hostname}:${hostport}`;
        const opts = {
            path: '/server',
            transports: ['websocket'],
        };

        this.socket = io(serverUrl, opts);
        this.roomUrl = url;
    }

    connectSocket() {
        return new Promise((resolve, reject) => {
           
            this.socket.on('connect', () => {
                //sendRequest('userEmail', {email: user.email})

            })

            this.socket.on('error', (err: any) => {
                console.error('socket.io ERROR:', err);
                reject(err);
            });

            this.socket.on('disconnect', (evt: any) => {
                console.log('socket.io disconnect:', evt);
            });

            this.socket.on('socketConnection-finish', async (message: { type: string, id: any }) => {      
                
                await this.sendRequest('prepare_room', {roomId: this.roomUrl})
                    .then(()=>{
                        console.log('prepare room : ', this.roomUrl);
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

            // this.socket.on('newProducer', function (message: any) {
            //     console.log('socket.io newProducer:', message);
            //     const remoteId = message.socketId;
            //     const prdId = message.producerId;
            //     const kind = message.kind;
            //     if (kind === 'video') {
            //         console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            //         consumeAdd(consumerTransport, remoteId, prdId, kind);
            //     }
            //     else if (kind === 'audio') {
            //         //console.warn('-- audio NOT SUPPORTED YET. skip remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            //         console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            //         consumeAdd(consumerTransport, remoteId, prdId, kind);
            //     }
            // });

            // this.socket.on('producerClosed', function (message: any) {
            //     console.log('socket.io producerClosed:', message);
            //     const localId = message.localId;
            //     const producereId = message.producereId;
            //     const kind = message.kind;
            //     console.log('--try removeConsumer remoteId=%s, localId=%s, track=%s', producereId, localId, kind);
            //     removeConsumer(producereId, kind);
            //     removeRemoteVideo(producereId);
            // })

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