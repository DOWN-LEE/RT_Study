import { types as mediaSoupTypes } from 'mediasoup-client';
import React from 'react';



export interface publishDataType{
    localStream: any,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    socket: any,
    producerTransport: mediaSoupTypes.Transport,
    device: mediaSoupTypes.Device
}