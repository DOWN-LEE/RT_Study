import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';

import { api } from '../../api/axios';
import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import {io, Socket} from 'socket.io-client';

import { SocketConnect } from './SocketConnect/SocketConnect';

import { Publish } from './Publish/Publish';
import { Subsribe } from './Subscribe/Subscribe';

import { userVideo, app } from './@type/index';
import './Room1.css';
import qs from 'qs';
import { useSelector } from 'react-redux';

import MyVideo from './Video/MyVideo';
import  Video from './Video';



const useStyles = makeStyles((theme: Theme) =>
  createStyles({
      paper: {
          padding: theme.spacing(2),
          margin: 'auto',
          maxWidth: '40vw',
      },
      container: {
          height: '82vh'
      }
  }),
);


export let socketConnect: SocketConnect;
let publish: Publish;
let subsribe: Subsribe;
let device: Device;




const Room1 = (props: app) => {

    const localVideoRef = useRef<HTMLVideoElement>(null);

    // let localStream: any = null;
    // let socket: Socket;
    // let socketId: string;
    // let consumerTransport: mediaSoupTypes.Transport;
    // let producerTransport: mediaSoupTypes.Transport;
    // let device: mediaSoupTypes.Device;
    // let videoConsumers: any = { };
    // let audioConsumers: any = { };

    // let mediaStreams: any = { };

    // let facemodel: blazeface.BlazeFaceModel;


    const classes = useStyles();

    

    const [deviceReady, setDeviceReady] = useState<boolean>(false);
    const [userVideos, setUserVideos] = useState<Array<userVideo>>([]);

   
    const { user } = useSelector((state: any) => state.authentication)


    useEffect(() => {
        async function initalizeSocket() {
            const url = props.match.params.roomId;
            socketConnect = new SocketConnect(url);
 
            await socketConnect.connectSocket()
                .catch((error) => {
                    console.log(error);
                    return;
                });

            const routerRtpCapabilities: mediaSoupTypes.RtpCapabilities = await socketConnect.sendRequest('getRouterRtpCapabilities', {})
                .catch((err: any) => {
                    console.log("[error]: ", err);
                });

            try {
                device = new Device();
            } catch (error: any) {
                if (error.name === 'UnsupportedError') {
                    console.error('browser not supported');
                }
            }
            await device.load({ routerRtpCapabilities });

            setDeviceReady(true);
        }

        initalizeSocket();
    },[]);

    useEffect(() => {
        if (deviceReady) {
            subsribe = new Subsribe(device, socketConnect);
            socketConnect.setSubscribe(subsribe);
            subsribe.subscribe();

            publish = new Publish(device, socketConnect, localVideoRef);
            publish.publish(true, true);
        }
    },[deviceReady])

    useEffect(() => {
        const updateVideo = setInterval(() => {
            setUserVideos(subsribe.userVideos);
        }, 1000);

        return () => {
            clearInterval(updateVideo);
        }
    },[])


    const backClick = () => {
        props.history.push('/');
    }

    



    const uservideoget = (videoinfo: userVideo, index: number) => {
        return (
            <div key={index}>
            <Grid item>
                <Video
                    stream={videoinfo.stream}
                />
            </Grid>
            </div>
        )
    }

    return(
        <div>
            <div className='header_bar'>
                <Button variant="contained" size="small" color='primary' onClick={()=>backClick()}>Back</Button>
            </div>
            <div className='total_zone'>
                


                <MyVideo localVideoRef={localVideoRef}/>

                <div className='user_zone'>
                    <div className='user_vidoes'>
                        <Grid container  className={classes.container}>
                            
                            {userVideos.map((videoinfo, index) => {
                                return uservideoget(videoinfo, index);
                            })
                            }
                            
                            
                        </Grid>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Room1