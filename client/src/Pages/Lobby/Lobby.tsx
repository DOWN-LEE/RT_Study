import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, makeStyles, withStyles, createStyles, Divider, Theme, Modal, Fade, Backdrop } from '@material-ui/core';
import SideBar from './SideBar/SideBar';
import { api } from '../../api/axios';
import { useDispatch, useSelector } from 'react-redux';

import './Lobby.css';


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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

const Lobby = () => {

    const [createWrong, setCreateWrong] = useState<boolean>(false);

    const { loggingIn } = useSelector((state: any) => state.authentication)
    const classes = useStyles();


    const createClick = () => {
        if (loggingIn != true) {
            setCreateWrong(true);
            return;
        }
    }


    return (
        <div className='Lobby_draw' style={{ flexDirection: 'row' }}>



            <SideBar />

            <div className='Lobby_room' >

                <div className='Lobby_top'>
                    <div className='Lobby_text'> Lobby </div>
                    <div className='Lobby_create'>
                        <Button variant="contained" color="primary" onClick={() => createClick()}>  Create! </Button>

                        <Modal
                            aria-labelledby="transition-modal-title"
                            aria-describedby="transition-modal-description"
                            open={createWrong}
                            onClose={() => { setCreateWrong(false) }}
                            closeAfterTransition
                            className={classes.modal}
                            BackdropComponent={Backdrop}
                            BackdropProps={{
                                timeout: 500,
                            }}
                        >
                            <Fade in={createWrong}>
                                <div className={classes.pad}>
                                    <h2 id="transition-modal-title">Wrong!</h2>
                                    <p id="transition-modal-description">로그인을 해주세요.</p>
                                </div>
                            </Fade>
                        </Modal>
                    </div>
                </div>



                <Divider variant='middle' />


            </div>



        </div>
    );


}

export default Lobby;