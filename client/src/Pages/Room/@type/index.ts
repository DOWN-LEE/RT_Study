import { types as mediaSoupTypes } from 'mediasoup-client';
import React from 'react';
import { History } from 'history';



export interface publishDataType{
    localStream: any,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    socket: any,
    producerTransport: mediaSoupTypes.Transport,
    device: mediaSoupTypes.Device
}



export interface userVideo {
    userName: string,
    producerId: string,
    stream: MediaStream
}

export interface app {
    history: History,
    match: any
}