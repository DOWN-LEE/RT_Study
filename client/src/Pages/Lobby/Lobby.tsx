import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, makeStyles, withStyles } from '@material-ui/core';
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
     <div className='Lobby_draw'>
        <SideBar/>
       
    </div>
    );


}

export default Lobby;