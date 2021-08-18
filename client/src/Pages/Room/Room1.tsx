import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Paper } from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import MicIcon from '@material-ui/icons/Mic';

import './Room1.css';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
      paper: {
          padding: theme.spacing(2),
          margin: 'auto',
          maxWidth: '40vw',
      },
  }),
);


const Room1 = () => {


    const classes = useStyles();

    return(
        <div>
            <div className='header_bar'>
                <Button variant="contained" size="small" color='primary'>Back</Button>
            </div>
            <div className='total_zone'>
                <div className='my_zone'>
                    <div>
                        <video className='my_video'/>
                    </div>
                    <div className='my_buttons'>
                        <ButtonGroup variant="contained" color="primary" aria-label="outlined primary button group">
                            <Button> <VideocamIcon/> </Button>
                            <Button> <MicIcon/> </Button>
                        </ButtonGroup>
                    </div>
                    <div>
                            <a className='today_rt'>RST of Today</a>
                            <a className='timer'> 00:00:00 </a> 
                        
                    </div>
                    
                </div>
                <div className='user_zone'>

                </div>
            </div>
        </div>
    )
}

export default Room1