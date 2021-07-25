import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import { publishDataType } from './@type/index';


let socket: any = null;
let localStream: any;
let localVideoRef: React.RefObject<HTMLVideoElement>;
let producerTransport: mediaSoupTypes.Transport;
let device: mediaSoupTypes.Device;
let videoProducer: mediaSoupTypes.Producer;
let audioProducer: mediaSoupTypes.Producer;


export async function VideoOn(publishData: publishDataType) {
    socket = publishData.socket;
    localStream = publishData.localStream;
    localVideoRef = publishData.localVideoRef;
    producerTransport = publishData.producerTransport;
    device = publishData.device;

    navigator.mediaDevices.getUserMedia({video:true, audio:true})
    .then((stream : any)=>{
        localStream = stream;
        playVideo(localVideoRef, localStream);
    })
    .catch(error => {
        console.log('getUserMedia error!', error);
    });

    console.log('--- createProducerTransport --');
    const params = await sendRequest('createProducerTransport', {});
    producerTransport = device.createSendTransport(params);
    
    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        sendRequest('connectProducerTransport', { dtlsParameters: dtlsParameters })
            .then(callback)
            .catch(errback);
    });

    producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
            const { id } = await sendRequest('produce', {
                transportId: producerTransport.id,
                kind,
                rtpParameters,
            });
            callback({ id });
        } catch (err) {
            errback(err);
        }
    });

    producerTransport.on('connectionstatechange', (state) => {
        switch (state) {
            case 'connecting':
                console.log('publishing...');
                break;

            case 'connected':
                console.log('published');
                break;

            case 'failed':
                console.log('failed');
                producerTransport.close();
                break;

            default:
                break;
        }
    });
    
   
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        const trackParams = { track: videoTrack };
        videoProducer = await producerTransport.produce(trackParams);
    }


    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        const trackParams = { track: audioTrack };
        audioProducer = await producerTransport.produce(trackParams);
    }


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