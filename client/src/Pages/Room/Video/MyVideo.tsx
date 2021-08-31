import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { socketConnect } from '../Room1';
import { useSelector } from 'react-redux';
import { api } from '../../../api/axios';
import qs from 'qs';

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

import './MyVideo.css';

let facemodel: blazeface.BlazeFaceModel;

const MyVideo = (props: any) => {

    const [myVideoOn, setMyVideoOn] = useState<boolean>(true);
    const [myMicOn, setMyMicOn] = useState<boolean>(false);
    const [isFace, setIsFace] = useState(false);
    const [timerOn, setTimerOn] = useState(false);
    const [studyTime, setStudyTime] = useState<number>(0);

    const faceCheck: any = useRef(null);
    const studyTimer: any = useRef(null);
    
    const { user } = useSelector((state: any) => state.authentication)
    
    useEffect(() => {
        api.post('/time/get/', qs.stringify({name: user.name}))
            .then((response) => {
                const time = Number(response.data.data.time);
                setStudyTime(time);
            })
            .catch((error) => {
                console.log(error);
            });
    },[]);

    useEffect(() => {
        const initTM = async () => {
            await tf.setBackend('webgl');
            facemodel = await blazeface.load();

            faceCheck.current = setInterval(async () => {
            
                if (!props.localVideoRef.current) {
                    return;
                }
                
                const totalArea = props.localVideoRef.current.videoWidth * props.localVideoRef.current.videoHeight;
                const preds = await facemodel.estimateFaces(props.localVideoRef.current, false);
    
                let facechecker = false;
                
                for (let i = 0; i < preds.length; i++) {
                    let p: any = preds[i];

                    const faceArea = (p.bottomRight[0] - p.topLeft[0]) * (p.bottomRight[1] - p.topLeft[1]);
                    console.log(faceArea, totalArea);
                    if(faceArea * 25 > totalArea){
                        setIsFace(true);
                        facechecker = true;
                        break;
                    } 
                }
                
                if(facechecker==false){
                    setIsFace(false);
                }
                
            }, 1500);

        }
        initTM();
    }, []);

    useEffect(()=>{
        const date = new Date();
        if(timerOn == true && isFace==false){
            setTimerOn(false);
            clearInterval(studyTimer.current);
        }
        
        if(timerOn == false && isFace == true && myVideoOn == true){
            setTimerOn(true);
            studyTimer.current = setInterval(() => {
                setStudyTime((timer) => timer + 1)
            }, 1000);
        }

    }, [isFace, myVideoOn]);


    useEffect(() => {
        if(studyTime % 10 == 0 && studyTime != 0){
            api.post('/time/update/', qs.stringify({name: user.name, time: studyTime}))
        }
    },[studyTime])


    const videoIconClick = () => {
        if(!socketConnect) return;

        if(myVideoOn){
            socketConnect.sendRequest('myVideoOff', {});
            setTimerOn(false);
            clearInterval(studyTimer.current);
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

    const formatTime = () => {
        const getSeconds: any = `0${(studyTime % 60)}`.slice(-2)
        const minutes: any = `${Math.floor(studyTime / 60)}`
        const getMinutes = `0${minutes % 60}`.slice(-2)
        const getHours = `0${Math.floor(studyTime / 3600)}`.slice(-2)
    
        return `${getHours} : ${getMinutes} : ${getSeconds}`
    }


    return(
        <div className='my_zone'>
            <div className='my_face'>
                <video className='my_video' ref={props.localVideoRef} muted />
                <img 
                    style={{visibility: myVideoOn? 'hidden' : 'visible'}}
                    className='my_photo'
                    src='/img/person.jpg'
                />
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
                <a className='timer' style={{color: timerOn? '#5ee93b' : 'red'}}> {formatTime()} </a>

            </div>

        </div>
    )
}

export default MyVideo;