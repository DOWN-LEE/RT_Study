import React, { useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';
import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import io from 'socket.io-client';


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

let localStream : any = null;
let socket : any = null;
let device : mediaSoupTypes.Device;


const Room = () =>{

    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [status, setStatus] = useState('Hi');
    




    // join
    useEffect(()=>{

      
        connect();
        
    },[]);

    






    function VideoOn() {
        navigator.mediaDevices.getUserMedia({video:true, audio:true})
        .then((stream : any)=>{
            localStream = stream;
            playVideo(localVideoRef, localStream);
        })
        .catch(error => {
            console.log('getUserMedia error!', error);
        });
    }

    




  
    return(
        <Container>
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

            <h1>{status}</h1>

        </Container>

    )
}

export default Room;

async function connect() {

    await connectSocket();

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
    if (socket){
        socket.close();
        socket = null;
    }

    return new Promise((resolve, reject) =>{
        const serverUrl = `http://${hostname}:${hostport}`;
        const opts = {
            path: '/server',
            transports: ['websocket'],
        };

        socket = io(serverUrl, opts);

        socket.on('connect', ()=>{
            console.log('socket-client connected!');
        })

        socket.on('error', (err : any)=>{
            console.error('socket.io ERROR:', err);
            reject(err);
        });

        socket.on('disconnect', (evt : any)=>{
            console.log('socket.io disconnect:', evt);
        });

        socket.on('message', (message:any)=>{
            console.log('socket.io message:', message);
            if (message.type === 'welcome') {
                if (socket.id !== message.id) {
                console.warn('WARN: something wrong with clientID', socket.io, message.id);
                }

                let clientId = message.id;
                console.log('connected to server. clientId=' + clientId);
                resolve(null);
            }
            else {
                console.error('UNKNOWN message from server:', message);
            }
        });



    })

}



function playVideo(element : any, stream : any) {
    if (element.current.srcObject) {
        console.warn('element ALREADY playing, so ignore');
        return;
    }
    element.current.srcObject = stream;
    return element.current.play();
}

function sendRequest(type : string, data : any): any {
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