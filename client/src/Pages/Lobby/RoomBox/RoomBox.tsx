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
    history: History
}

const RoomBox = (props: box) => {

    const classes = useStyles();
    const { user } = useSelector((state: any) => state.authentication)

    const roomBoxClick = () => {
        
        api.post('/room/join/',qs.stringify({email: user.email, roomName: props.name}))
            .then((response) => {  
                if(response.status == 200){
                    const url = response.data.data;
                    props.history.push('/room/'+url);
                } 
            })
            .catch((error) => {
                if(error.status == 403){
                    //exceed
                }
                else if(error.status == 404){
                    //error
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