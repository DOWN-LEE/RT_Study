import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { socketConnect } from '../Room1';
import { useSelector } from 'react-redux';
import { userVideo } from '../@type/index';



import './UserVideo.css';

interface userVideoApp{
    userVideo: userVideo
}


const UserVideo = (props: userVideoApp) => {

    const ref = useRef<HTMLVideoElement>(null);
  

    useEffect(() => {
        if (ref.current){
            ref.current.srcObject = props.userVideo.stream;
        }
    },[])

    

    const isMuted = () => {
        if(props.userVideo.muted){
            return(
                <MicOffIcon color='secondary' fontSize='small'/>
            )
        }
    }

  

    return(
        <>
            <div className='user_face'>
                <video
                    className='user_video'
                    autoPlay
                    ref={ref}
                />
                <img 
                    style={{visibility: props.userVideo.videoOn? 'hidden' : 'visible'}}
                   
                    className='user_photo'
                    src='/img/person.jpg'
                />
                
            </div>
            

        
        
            <div className='user_video_info'>
                <div className='user_video_name'>
                    {props.userVideo.userName}
                    {isMuted()}
                </div>

            </div>
        
        
        
        </>
    )
}

export default UserVideo;