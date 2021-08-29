import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { socketConnect } from '../Room1';

const MyVideo = (props: any) => {

    const [myVideoOn, setMyVideoOn] = useState<boolean>(true);
    const [myMicOn, setMyMicOn] = useState<boolean>(false);


    const videoIconClick = () => {
        if(!socketConnect) return;

        if(myVideoOn){
            socketConnect.sendRequest('myVideoOff', {});
        }
        else{
            socketConnect.sendRequest('myVideoOn', {});
        }
        setMyVideoOn(!myVideoOn);
    }

    const micIconClick = () => {
        if(myMicOn){
            socketConnect.sendRequest('myAudioOff', {});
        }
        else{
            socketConnect.sendRequest('myAudioOn', {});
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
        <div className='my_zone'>
            <div>
                <video className='my_video' ref={props.localVideoRef} muted />
            </div>
            <div className='my_buttons'>
                <ButtonGroup variant="contained" aria-label="outlined primary button group">
                    <Button color={myVideoOn ? 'primary' : 'default'} onClick={() => videoIconClick()}>
                        {videoIcon()}
                    </Button>
                    <Button color={myMicOn ? 'primary' : 'default'} onClick={() => micIconClick()}>
                        {micIcon()}
                    </Button>
                </ButtonGroup>
            </div>
            <div>
                <a className='today_rt'>RST of Today</a>
                <a className='timer'> 00:00:00 </a>

            </div>

        </div>
    )
}

export default MyVideo;