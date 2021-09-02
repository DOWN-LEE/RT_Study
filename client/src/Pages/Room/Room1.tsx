import React, { useEffect, useRef, useState } from 'react';
import { Button, makeStyles, createStyles, Theme, Grid, Modal, Fade, Backdrop } from '@material-ui/core';


import { Device, types as mediaSoupTypes } from 'mediasoup-client';


import { SocketConnect } from './SocketConnect/SocketConnect';

import { Publish } from './Publish/Publish';
import { Subsribe } from './Subscribe/Subscribe';

import { userVideo, app } from './@type/index';
import './Room1.css';


import MyVideo from './Video/MyVideo';
import UserVideo from './Video/UserVideo';

import { useDispatch, useSelector } from 'react-redux';




import { checkLogin, tryLogout, tryLogin } from '../../store/authentication/authentication';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
      paper: {
          padding: theme.spacing(2),
          margin: 'auto',
          maxWidth: '40vw',
      },
      container: {
          height: '82vh'
      },
      modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pad: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
  }),
);


export let socketConnect: SocketConnect;
let publish: Publish;
let subsribe: Subsribe;
let device: Device;




const Room1 = (props: app) => {

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const classes = useStyles();

    const [deviceReady, setDeviceReady] = useState<boolean>(false);
    const [subReady, setSubReady] = useState<boolean>(false);
    const [userVideos, setUserVideos] = useState<Array<userVideo>>([]);
    const [wrongModal, setWrongModal] = useState<boolean>(false);
    const [modalMesg, setModalMesg] = useState<string>('');

    const { loggingIn, user } = useSelector((state: any) => state.authentication)

    const dispatch = useDispatch();

    useEffect(() => {  
        if(loggingIn == undefined)
            dispatch(checkLogin());
    },[]);
    


    useEffect(() => {
        if(loggingIn!=true){
            return;
        }

        async function initalizeSocket() {
            try {
                const url = props.match.params.roomId;
                socketConnect = new SocketConnect(url, user);

                await socketConnect.connectSocket()
                    .catch((error) => {
                        throw(error);
                    });

                const routerRtpCapabilities: mediaSoupTypes.RtpCapabilities = await socketConnect.sendRequest('getRouterRtpCapabilities', { })
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

                socketConnect.socket.on('newConnection', () => {
                    socketConnect.socket.close();
                    errorModal("새로운 접속이 감지됐습니다.")
                });
            }
            catch (error: any) {
                errorModal(error);
            }
        }

        initalizeSocket();
    },[loggingIn]);

    useEffect(() => {
        if (deviceReady) {
            subsribe = new Subsribe(device, socketConnect);
            socketConnect.setSubscribe(subsribe);
            subsribe.subscribe();
            setSubReady(true);

            publish = new Publish(device, socketConnect, localVideoRef);
            publish.publish(true, true);
        }
    },[deviceReady])

    useEffect(() => {
        if (subReady) {
            const updateVideo = setInterval(() => {
                setUserVideos(subsribe.userVideos);
            }, 1000);

            return () => {
                clearInterval(updateVideo);
            }
        }

    }, [subReady]);

    


    const backClick = () => {
        socketConnect.socket.close();
        props.history.push('/');
    }

    
    const uservideoget = (videoinfo: userVideo, index: number) => {
        return (
            <div key={index}>
            <Grid item>
                <UserVideo
                    userVideo={videoinfo}
                />
            </Grid>
            </div>
        )
    }

    const errorModal = (message: string) => {
        setModalMesg(message);
        setWrongModal(true);
    }

    if(loggingIn)
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

                <Modal
                    open={wrongModal}
                    onClose={() => { setWrongModal(false); props.history.push('/'); }}
                    closeAfterTransition
                    className={classes.modal}
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                        timeout: 500,
                    }}
                >
                    <Fade in={wrongModal}>
                        <div className={classes.pad}>
                            <h2>Wrong!</h2>
                            <p>{modalMesg}</p>
                        </div>
                    </Fade>
                </Modal>
            </div>
        )
    else
        return(
            <div>기달려주세용!</div>
        )
}

export default Room1