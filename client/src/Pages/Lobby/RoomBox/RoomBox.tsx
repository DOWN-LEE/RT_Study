import React, { useEffect, useRef, useState } from 'react';
import { Typography, Button, makeStyles, Grid, createStyles, Divider, Theme, Modal, Fade, Backdrop, Paper } from '@material-ui/core';

import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../../api/axios';
import qs from 'qs';
import { History } from 'history';
import './RoomBox.css';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        paper: {
            padding: theme.spacing(2),
            marginLeft: 10,
            marginRight: 15,
            marginTop: 25,
            width: 200,
            height: 100,
            '&:hover': {
                background: "#F0F0F0",
                cursor: 'pointer'
            }
        }
    }),
);

interface box {
    name: string,
    currentMembers: number,
    limitMembers: number,
    history: History,
    setCreateWrong: any,
    errorModal: any,
}

const RoomBox = (props: box) => {

    const classes = useStyles();
    const { loggingIn, user } = useSelector((state: any) => state.authentication)

    const roomBoxClick = () => {

        if(loggingIn!=true){
            props.setCreateWrong(true);
            return;
        }
        
        api.post('/room/join/',qs.stringify({email: user.email, roomName: props.name}))
            .then((response) => {  
                if(response.status == 200){
                    const url = response.data.data;
                    props.history.push('/room/'+url);
                } 
            })
            .catch((error) => {
                if(error.response.status == 403){
                    props.errorModal('인원이 초과했습니다.')
                }
                else if(error.response.status == 404){
                    props.errorModal('유효하지 방입니다.')
                }
            });

        
    }

    return (
        <Grid item >
            <Paper elevation={3} className={classes.paper} onClick={()=>roomBoxClick()}>
                <div className='roomBox_title'>
                    {props.name}
                </div>

                <div className='roomBox_members'>
                    {props.currentMembers} / {props.limitMembers}
                </div>

            </Paper>
        </Grid>
    );


}

export default RoomBox;