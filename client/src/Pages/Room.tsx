import React, { useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';
import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import io from 'socket.io-client';

import { VideoOn } from './Publish';

import { publishDataType } from './@type/index';
import { userInfo } from 'node:os';

const Container = Styled.div`
    position: relative;
    display: inline-block;
    width: 240px;
    height: 240px;
    margin: 5px;
`;

const VideoContainer = Styled.video`
    width: 240px;
    height: 240px;
    background-color: black;
`;


const hostname = 'localhost';
const hostport = '3002';

let localStream: any = null;
let socket: any = null;
let socketId: any = null;
let consumerTransport: mediaSoupTypes.Transport;
let producerTransport: mediaSoupTypes.Transport;
let device: mediaSoupTypes.Device;
let videoConsumers: any = {};
let audioConsumers: any = {};



const Room = () =>{

    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [status, setStatus] = useState('Hi');
    const [connectReady, setConnectReady] = useState(false);
    const [subVideos, setSubVideos] = useState([]);
    
    

    const videoOnClick = () => {

        const publishData: publishDataType = {
            localStream: localStream,
            localVideoRef: localVideoRef,
            socket: socket,
            producerTransport: producerTransport,
            device: device
        }

        VideoOn(publishData);
    }



    // join
    useEffect(()=>{

        con();

        async function con() {
            await connect();
            setConnectReady(true);
        }
        
    },[]);


    useEffect(()=>{
        if(connectReady)
            subscribe();
    },[connectReady])

    






    

    




  
    return(
        <Container>
            <button onClick={videoOnClick} disabled={!connectReady}>ho</button>
            <video
                style={{
                    width: 240,
                    height: 240,
                    margin: 5,
                    backgroundColor: 'pink'
                }}
                ref={localVideoRef}
                >
            </video>

            {subVideos.map((videoinfo, index) => (
                <video
                style={{
                    width: 240,
                    height: 240,
                    margin: 5,
                    backgroundColor: 'pink'
                }}
                ref={videoinfo}
                key={index}
                >
                </video>
            ))}

            <h1>{status}</h1>

        </Container>

    )
}

export default Room;

async function connect() {
    
    await connectSocket().catch(error => {
        console.log(error);
        return;
    });
    

    const data: mediaSoupTypes.RtpCapabilities = await sendRequest('getRouterRtpCapabilities', {});
    console.log('getRouterRtpCapabilities:', data);
    await loadDevice(data);
    




    async function loadDevice(routerRtpCapabilities : mediaSoupTypes.RtpCapabilities) {
        try {
            device = new Device();
        } catch (error : any) {
            if (error.name === 'UnsupportedError') {
                console.error('browser not supported');
            }
        }
        await device.load({ routerRtpCapabilities });
    }
    
}

function connectSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }

    return new Promise((resolve, reject) => {
        const serverUrl = `http://${hostname}:${hostport}`;
        const opts = {
            path: '/server',
            transports: ['websocket'],
        };

        socket = io(serverUrl, opts);

        socket.on('connect', () => {
            console.log('socket-client connected!');
        })

        socket.on('error', (err: any) => {
            console.error('socket.io ERROR:', err);
            reject(err);
        });

        socket.on('disconnect', (evt: any) => {
            console.log('socket.io disconnect:', evt);
        });

        socket.on('socketConnection-finish', (message: { type: string, id: any }) => {
            console.log('socketConnection-finish', message);
            if (message.type === 'finish') {
                if (socket.id !== message.id) {
                    console.warn('WARN: socket-client != socket-server', socket.io, message.id);
                }

                console.log('connected to server. clientId=' + message.id);
                socketId = message.id;
                resolve(null);
            }
            else {
                console.error('UNKNOWN message from server:', message);
            }
        });

    })
}

async function subscribe() {
    console.log('subscribe')
    const params = await sendRequest('createConsumerTransport',{});
    
    consumerTransport = device.createRecvTransport(params);
    console.log('subscribe1')
    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback)=>{
        sendRequest('connectConsumerTransport', {dtlsParameters: dtlsParameters})
            .then(callback)
            .catch(errback);
    });

    consumerTransport.on('connectionstatechange', (state) => {
        switch (state) {
            case 'connecting':
                console.log('subscribing...');
                break;

            case 'connected':
                console.log('subscribed');
                break;

            case 'failed':
                console.log('failed');
                consumerTransport.close();
                break;

            default:
                break;
        }
    });
    

    consumeOtherProducers(socketId);

}

async function consumeOtherProducers(socketId: any) {
    const otherProducers = await sendRequest('getOtherProducers', {localId: socketId})
        .catch((error: any) => {
            console.log('getOtherProducers error', error);
            return;
        });
    const videoIds = otherProducers.VideoIds;
    const audioIds = otherProducers.AudioIds;
    console.log('otherProducers', otherProducers);
    
    videoIds.forEach((vid: any) => {
        consumeAdd(consumerTransport, vid, null, 'video');
    });

    audioIds.forEach((aid: any) => {
        consumeAdd(consumerTransport, aid, null, 'audio');
    });
};

async function consumeAdd(consumerTransport: mediaSoupTypes.Transport, producerSocketId: any, prdId: any, tkind: string) {
    const { rtpCapabilities } = device;
    const data = await sendRequest('consumeAdd', { rtpCapabilities: rtpCapabilities, producereId: producerSocketId, kind: tkind })
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
    addSubVideo(producerSocketId, consumer.track);
    addConsumer(producerSocketId, consumer, kind);


    if (kind === 'video') {
        console.log('--try resumeAdd --');
        sendRequest('resumeAdd', { producerId: producerSocketId, kind: kind })
            .then(() => {
                console.log('resumeAdd OK');
            })
            .catch((err: any) => {
                console.error('resumeAdd ERROR:', err);
            });
    }

    
}




function sendRequest(type : string, data : any): any {
    console.log('sendRequest', type);
    return new Promise((resolve, reject) => {
        socket.emit(type, data, (respond : any, err : any) => {
            if(err){
                reject(err);
            }
            else{
                resolve(respond);
            }
        })
    })
}

function addConsumer(id: any, consumer: any, kind: any) {
    if (kind === 'video') {
        videoConsumers[id] = consumer;
        console.log('videoConsumers count=' + Object.keys(videoConsumers).length);
    }
    else if (kind === 'audio') {
        audioConsumers[id] = consumer;
        console.log('audioConsumers count=' + Object.keys(audioConsumers).length);
    }
    else {
        console.warn('UNKNOWN consumer kind=' + kind);
    }
}

function addSubVideo(producerSocketId: any, track: any){
    

    const newStream = new MediaStream();
    newStream.addTrack(track);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    
}