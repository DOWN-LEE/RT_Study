
import { Device, types as mediaSoupTypes } from "mediasoup-client";
import { Socket } from "socket.io-client";
import { SocketConnect } from '../SocketConnect/SocketConnect';

export class Publish {
    public device: Device;
    public producerTransport!: mediaSoupTypes.Transport;
    public localVideoRef: React.RefObject<HTMLVideoElement>;
    public socketConnect: SocketConnect;
    public localStream: any;

    constructor(device: Device, socketConnect: SocketConnect, localVideoRef: React.RefObject<HTMLVideoElement>) {
        this.device = device;
        this.socketConnect = socketConnect;
        this.localVideoRef = localVideoRef;

    }

    async publish(videoOn: boolean, micOn: boolean) {

        await navigator.mediaDevices.getUserMedia({ video: videoOn, audio: micOn })
            .then((stream: any) => {
                this.localStream = stream;
                this.playVideo(this.localVideoRef, this.localStream);
            })
            .catch(error => {
                console.log('getUserMedia error!', error);

                // TODO PUBLISH 끝내기
            });

        console.log('--- createProducerTransport --');
        const params = await this.socketConnect.sendRequest('createProducerTransport', {});
        this.producerTransport = this.device.createSendTransport(params);

        this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            this.socketConnect.sendRequest('connectProducerTransport', { dtlsParameters: dtlsParameters })
                .then(callback)
                .catch(errback);
        });

        this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            console.log('--trasnport produce');
            try {
                const { id } = await this.socketConnect.sendRequest('produce', {
                    transportId: this.producerTransport.id,
                    kind,
                    rtpParameters,
                });
                callback({ id });
            } catch (err) {
                errback(err);
            }
        });

        this.producerTransport.on('connectionstatechange', (state) => {
            switch (state) {
                case 'connecting':
                    console.log('publishing...');
                    break;

                case 'connected':
                    console.log('published');
                    break;

                case 'failed':
                    console.log('failed');
                    this.producerTransport.close();
                    break;

                default:
                    break;
            }
        });


        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            const trackParams = { track: videoTrack };
            await this.producerTransport.produce(trackParams);
        }


        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            const trackParams = { track: audioTrack };
            await this.producerTransport.produce(trackParams);
        }


    }


    private playVideo(element: any, stream: any) {
        if (element.current.srcObject) {
            console.warn('element ALREADY playing, so ignore');
            return;
        }
        element.current.srcObject = stream;
        return element.current.play();
    }

}