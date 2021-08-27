import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper, Grid } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { api } from '../../api/axios';

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

interface app {
    history: History
}

const Room1 = (props: app) => {


    const classes = useStyles();

    const [myVideoOn, setMyVideoOn] = useState<boolean>(true);
    const [myMicOn, setMyMicOn] = useState<boolean>(false);

    const { user } = useSelector((state: any) => state.authentication)

    const backClick = () => {
        props.history.push('/');
    }

    const joinClick = async() => {
        await api
            .post('/room/join', qs.stringify({ email: user.email, roomName: '' }))
            .then((response) => {
                const url = response.data.data;

            })
            .catch((error) => {
                if(error.status == 403){ //exceed

                }
                if(error.status == 404){ //error

                }
            });
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
                        <video className='my_video'/>
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