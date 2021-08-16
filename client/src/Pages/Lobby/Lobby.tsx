import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, makeStyles, withStyles, Divider } from '@material-ui/core';
import SideBar from './SideBar/SideBar';

import './Lobby.css';

const CssTextField = withStyles({
    root: {
      '& label.Mui-focused': {
        color: 'grey',
      },
      '& .MuiOutlinedInput-root': {
   
        '&.Mui-focused fieldset': {
          borderColor: 'grey',
        },
      },
    },
  })(TextField);

const Lobby = () =>{


    




    return (
     <div className='Lobby_draw' style={{flexDirection:'row'}}>
        
   
            
        <SideBar/>
         
        <div className='Lobby_room' >

            <div className='Lobby_top'>
                <div className='Lobby_text'> Lobby </div>
                <div className='Lobby_create'>
                    <Button variant="contained" color="primary"> Create! </Button>
                </div>
            </div>
            
            <Divider variant='middle'/>
            

        </div>
       
        
       
    </div>
    );


}

export default Lobby;