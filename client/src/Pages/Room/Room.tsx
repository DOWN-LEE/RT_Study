import React, { useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';
import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import io from 'socket.io-client';

import { VideoOn } from './Publish';
import Video from './Video';
import { publishDataType } from './@type/index';

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

import './Room.css';

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
const hostport = '3001';

let localStream: any = null;
let socket: any = null;
let socketId: any = null;
let consumerTransport: mediaSoupTypes.Transport;
let producerTransport: mediaSoupTypes.Transport;
let device: mediaSoupTypes.Device;
let videoConsumers: any = {};
let audioConsumers: any = {};

let mediaStreams: any = {};

let facemodel: blazeface.BlazeFaceModel;



const Room = (props: any) => {

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const studyTimer: any = useRef(null);
    const faceCheck: any = useRef(null);

    const [status, setStatus] = useState('Hi');
    const [connectReady, setConnectReady] = useState(false);
    const [subVideos, setSubVideos] = useState<Array<any>>([]);

    const [studyTime, setStudyTime] = useState<number>(0);
    const [latestTime, setLatestTime] = useState<number>(0);
    const [isFace, setIsFace] = useState(false);
    const [timerOn, setTimerOn] = useState(false);
    

    const formatTime = () => {
        const getSeconds: any = `0${(studyTime % 60)}`.slice(-2)
        const minutes: any = `${Math.floor(studyTime / 60)}`
        const getMinutes = `0${minutes % 60}`.slice(-2)
        const getHours = `0${Math.floor(studyTime / 3600)}`.slice(-2)
    
        return `${getHours} : ${getMinutes} : ${getSeconds}`
    }


    const videoOnClick = () => {
        
        const videoOnClick_ = async() => {
            const publishData: publishDataType = {
                localStream: localStream,
                localVideoRef: localVideoRef,
                socket: socket,
                producerTransport: producerTransport,
                device: device
            }
    
            await VideoOn(publishData);
            
            faceCheck.current = setInterval(async () => {
               
                
                if (!localVideoRef.current) {
                    return;
                }
                
                
                const totalArea = localVideoRef.current.videoWidth * localVideoRef.current.videoHeight;
                console.log("@@", localVideoRef.current.videoWidth, localVideoRef.current.videoHeight)
                const preds = await facemodel.estimateFaces(localVideoRef.current, false);
                

                let facechecker = false;
                
                for (let i = 0; i < preds.length; i++) {
                    let p: any = preds[i];

                    const faceArea = (p.bottomRight[0] - p.topLeft[0]) * (p.bottomRight[1] - p.topLeft[1]);
                    console.log(faceArea, totalArea);
                    if(faceArea * 25 > totalArea){
                        setIsFace(true);
                        facechecker = true;
                        break;
                    }
                    
                }
                
                if(facechecker==false){
                    setIsFace(false);
                }
                

            }, 1500);


        }

        videoOnClick_();
        
    }

   

    // join
    useEffect(() => {

        con();

        async function con() {
            await connect();
            setConnectReady(true);
        }

    }, []);


    useEffect(() => {
        if (connectReady)
            subscribe();
    }, [connectReady])


    useEffect(() => {
        const initTM = async () => {
            await tf.setBackend('webgl');
            facemodel = await blazeface.load();
        }
        initTM();
    }, []);


    useEffect(()=>{
        const date = new Date();
        if(timerOn == true && isFace==false && date.getTime() - latestTime > 2000){
            setTimerOn(false);
            clearInterval(studyTimer.current);
        }
        
        if(timerOn == false && isFace == true){
            setTimerOn(true);
            studyTimer.current = setInterval(() => {
                setStudyTime((timer) => timer + 1)
            }, 1000);
        }

    }, [isFace]);









    const videoOnClick2 = async () => {
        console.log("face!")
        let ctx: any;
        if(canvasRef.current && localVideoRef.current){
            canvasRef.current.width = localVideoRef.current.videoWidth;
            canvasRef.current.height = localVideoRef.current.videoHeight;
            ctx = canvasRef.current.getContext('2d');
        }
        else{
            return;
        }

        const preds = await facemodel.estimateFaces(localVideoRef.current, false);
        console.log(preds);
        for (let i = 0; i < preds.length; i++) {
            let p: any = preds[i];
            
            ctx.fillStyle = "#00FFFF";
            console.log("칠한다!, ", p.bottomRight[0] - p.topLeft[0],p.bottomRight[1] - p.topLeft[1])
            ctx.fillRect(p.topLeft[0], p.topLeft[1], p.bottomRight[0] - p.topLeft[0], p.bottomRight[1] - p.topLeft[1]);

        }


        
    }









    return (
        <Container>
            <button onClick={videoOnClick} disabled={!connectReady}>ho</button>
            <button onClick={videoOnClick2} disabled={!connectReady}>seo</button>
            <video
                className = 'myVideo'
                controls
                muted
                style={{
                    width:'30vw',
                    height:'30vw',
                    
                    margin: 5,
                    backgroundColor: 'pink'
                }}
                ref={localVideoRef}
            />
            {/* <canvas 
                className = 'myVideo2'
                ref={canvasRef}
                style={{width:'30vw', height:'30vw', border: '1px solid green'}}
            /> */}
            
            
           <h2 style={{color : timerOn? 'green' : 'red'}}> Time!!! {formatTime()}</h2>

            {subVideos.map((videoinfo, index) => {
                return (
                    <Video
                        key={index}
                        keys={index}
                        stream={videoinfo.stream}
                        id={videoinfo.id}
                    />
                )})
            }

            <h1>{status}</h1>

        </Container>

    )




    async function connect() {

        await connectSocket().catch(error => {
            console.log(error);
            return;
        });


        const data: mediaSoupTypes.RtpCapabilities = await sendRequest('getRouterRtpCapabilities', {})
            .catch((err: any)=>{
                console.log("[error]: ",err);
            });
        console.log('getRouterRtpCapabilities:', data);
        await loadDevice(data);





        async function loadDevice(routerRtpCapabilities: mediaSoupTypes.RtpCapabilities) {
            try {
                device = new Device();
            } catch (error: any) {
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
            socketId = null;
        }

        return new Promise((resolve, reject) => {
            const serverUrl = `http://${hostname}:${hostport}`;
            const opts = {
                path: '/server',
                transports: ['websocket'],
            };

            socket = io(serverUrl, opts);

            socket.on('connect', () => {
                const roomName = getRoomName();
                console.log('socket-client connected! room: ', roomName);

            })

            socket.on('error', (err: any) => {
                console.error('socket.io ERROR:', err);
                reject(err);
            });

            socket.on('disconnect', (evt: any) => {
                console.log('socket.io disconnect:', evt);
            });

            socket.on('socketConnection-finish', async (message: { type: string, id: any }) => {      
                const roomName = getRoomName();
                await sendRequest('prepare_room', {roomId: roomName})
                    .then(()=>{
                        console.log('prepare room : ', roomName);
                    });
                
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

            socket.on('newProducer', function (message: any) {
                console.log('socket.io newProducer:', message);
                const remoteId = message.socketId;
                const prdId = message.producerId;
                const kind = message.kind;
                if (kind === 'video') {
                    console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
                    consumeAdd(consumerTransport, remoteId, prdId, kind);
                }
                else if (kind === 'audio') {
                    //console.warn('-- audio NOT SUPPORTED YET. skip remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
                    console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
                    consumeAdd(consumerTransport, remoteId, prdId, kind);
                }
            });

            socket.on('producerClosed', function (message: any) {
                console.log('socket.io producerClosed:', message);
                const localId = message.localId;
                const producereId = message.producereId;
                const kind = message.kind;
                console.log('--try removeConsumer remoteId=%s, localId=%s, track=%s', producereId, localId, kind);
                removeConsumer(producereId, kind);
                removeRemoteVideo(producereId);
            })

        })
    }
    //TODO DISCONNECT

    async function subscribe() {
        console.log('subscribe start')
        

        if (!consumerTransport) {
            const params = await sendRequest('createConsumerTransport', {});
            consumerTransport = device.createRecvTransport(params);

            consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('--consumer trasnport connect');
                sendRequest('connectConsumerTransport', { dtlsParameters: dtlsParameters })
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
                        console.log('시발새키야');
                        break;
                }
            });


            consumeOtherProducers(socketId);
        }
        
    }

    async function consumeOtherProducers(socketId: any) {
        const otherProducers = await sendRequest('getOtherProducers', { localId: socketId })
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
        addSubVideo(producerSocketId, consumer.track, kind);
        addConsumer(producerSocketId, consumer, kind);

        consumer.on("producerclose", () => {
            console.log('--consumer producer closed. remoteId=' + consumer.producerId);
            consumer.close();
            removeConsumer(producerId, kind);
            removeRemoteVideo(consumer.producerId);
        });


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


    function removeConsumer(id: any, kind: any) {
        if (kind === 'video') {
            delete videoConsumers[id];
            console.log('videoConsumers count=' + Object.keys(videoConsumers).length);
        }
        else if (kind === 'audio') {
            delete audioConsumers[id];
            console.log('audioConsumers count=' + Object.keys(audioConsumers).length);
        }
        else {
            console.warn('UNKNOWN consumer kind=' + kind);
        }
    }

    function removeRemoteVideo(id: any) {
        console.log(' ---- removeRemoteVideo() id=' + id);
        
        setSubVideos((subVideos) => (subVideos.filter(item => item.id !== id)));
       
    }



    function sendRequest(type: string, data: any): any {
        console.log('[sendRequest]', type);
        return new Promise((resolve, reject) => {
            socket.emit(type, data, (respond: any, err: any) => {
                if (err) {
                    reject(err);
                }
                else {
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

    async function addSubVideo(producerSocketId: any, track: any, kind: any) {
        let stream = mediaStreams[producerSocketId];
        if(!stream){
            mediaStreams[producerSocketId] = new MediaStream();
            mediaStreams[producerSocketId].addTrack(track);
            
        }
        else{
            await mediaStreams[producerSocketId].addTrack(track);
            await setSubVideos(oldItems => [...oldItems, {id: producerSocketId, stream: mediaStreams[producerSocketId]}]);
            delete mediaStreams[producerSocketId];
            
        }

    }



    function getRoomName() {
        
       
        return props.match.params.roomname;
    }


}
export default Room;