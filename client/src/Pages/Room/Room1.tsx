import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { api } from '../../api/axios';
import { Device, types as mediaSoupTypes } from 'mediasoup-client';
import {io, Socket} from 'socket.io-client';

import { SocketConnect } from './SocketConnect/SocketConnect';

import { Publish } from './Publish/Publish'

import './Room1.css';
import qs from 'qs';
import { useSelector } from 'react-redux';
import { History } from 'history';



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


let socketConnect: SocketConnect;
let publish: Publish;
let device: Device;


interface app {
    history: History,
    match: any
}

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

    const [myVideoOn, setMyVideoOn] = useState<boolean>(true);
    const [myMicOn, setMyMicOn] = useState<boolean>(false);

    const [deviceReady, setDeviceReady] = useState<boolean>(false);

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
           
            publish = new Publish(device, socketConnect, localVideoRef);
            publish.publish(myVideoOn, myMicOn);
        }
    },[deviceReady])




    const backClick = () => {
        props.history.push('/');
    }

    

    const videoIconClick = () => {
        if(myVideoOn){

        }
        else{

        }
        setMyVideoOn(!myVideoOn);
    }

    const micIconClick = () => {
        if(myMicOn){

        }
        else{

        }
        setMyMicOn(!myMicOn);
    }


    const videoIcon = () => {
        if(!myVideoOn)
            return (<VideocamOffIcon/>)
        else
            return (<VideocamIcon/>)
    }

    const micIcon = () => {
        if(!myMicOn)
            return (<MicOffIcon/>)
        else
            return (<MicIcon/>)
    }


    return(
        <div>
            <div className='header_bar'>
                <Button variant="contained" size="small" color='primary' onClick={()=>backClick()}>Back</Button>
            </div>
            <div className='total_zone'>
                <div className='my_zone'>
                    <div>
                        <video className='my_video' ref={localVideoRef}/>
                    </div>
                    <div className='my_buttons'>
                        <ButtonGroup variant="contained" aria-label="outlined primary button group">
                            <Button color={myVideoOn? 'primary': 'default'} onClick={()=>videoIconClick()}>
                                {videoIcon()}
                            </Button>
                            <Button color={myMicOn? 'primary': 'default'} onClick={()=>micIconClick()}>
                                {micIcon()}
                            </Button>
                        </ButtonGroup>
                    </div>
                    <div>
                            <a className='today_rt'>RST of Today</a>
                            <a className='timer'> 00:00:00 </a> 
                        
                    </div>
                    
                </div>
                <div className='user_zone'>
                    <div className='user_vidoes'>
                        <Grid container alignItems="stretch" justifyContent="center" className={classes.container}>
                            
                            <Grid item md={6} >
                                <video className='user_video'/>
                            </Grid>
                            <Grid item md={6} >
                                <video className='user_video'/>
                            </Grid>
                            <Grid item md={6}>
                                <video className='user_video'/>
                            </Grid>
                            <Grid item md={6}>
                                <video className='user_video'/>
                            </Grid>
                            <Grid item md={6}>
                                <video className='user_video'/>
                            </Grid>
                            <Grid item md={6}>
                                <video className='user_video'/>
                            </Grid>
                            
                            
                        </Grid>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Room1