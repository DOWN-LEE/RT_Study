import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, makeStyles, Grid, createStyles, Divider, Theme, Modal, Fade, Backdrop, Select, MenuItem } from '@material-ui/core';
import SideBar from './SideBar/SideBar';
import { api } from '../../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import RoomBox from './RoomBox/RoomBox';
import qs from 'qs';
import { History } from 'history';
import RefreshIcon from '@material-ui/icons/Refresh';
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
        creatpad: {
            backgroundColor: theme.palette.background.paper,
            border: '2px solid #000',
            boxShadow: theme.shadows[5],
            padding: theme.spacing(2, 4, 3),
            width: 500
        },
        paper: {
            padding: theme.spacing(2),
            marginLeft: 10,
            marginRight: 15,
            marginTop: 25,
            width: 200,
            height: 100,
        }
    }),
);

interface box {
    name: string,
    currentMembers: number,
    limitMembers: number
}

interface app {
    history: History
}


const Lobby = (props: app) => {

    const [createWrong, setCreateWrong] = useState<boolean>(false);
    const [wrongMesg, setWrongMesg] = useState<string>('');
    const [rooms, setRooms] = useState<Array<box>>([]);
    const [refreshTimer, setRefreshTimer] = useState<number>(0);
    const [createModel, setCreateModel] = useState<boolean>(false);
    const [createRoomTitle, setCreateRoomTitle] = useState<string>('');
    const [createLimit, setCreateLimit] = useState<number>(4);

    const { loggingIn, user } = useSelector((state: any) => state.authentication)
    const classes = useStyles();


    useEffect(() => {
        api.get('/room/list/')
            .then((response) => {
                setRooms(response.data.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    useEffect(() => {
        if(refreshTimer > 0){
            const timer = setTimeout(() => setRefreshTimer(refreshTimer-1), 1000);

            return () => { clearTimeout(timer); }
        }
    }, [refreshTimer]);


    const refreshClick = async () => {
        if (refreshTimer != 0)
            return;

        api.get('/room/list/')
            .then((response) => {
                setRooms(response.data.data);
            })
            .catch((error) => {
                console.log(error);
            });

        setRefreshTimer(5);
        
    };

    const refreshIcon = () => {

        if (refreshTimer == 0) {
            return (<RefreshIcon />)
        }
        else {
            return (
                <div style={{ fontWeight: 700 }}>
                    {refreshTimer}
                </div>
            )
        }
    }

    const createClick = () => {
        if (loggingIn != true) {
            errorModal('로그인을 해주세요.')
            return;
        }

        setCreateModel(true);

    }

    const confirmClick = () => {
        if (createRoomTitle == '') {
            return;
        }

        api.post('/room/create/', qs.stringify({
            roomName: createRoomTitle,
            hostEmail: user.email,
            hostName: user.name,
            limitMembers: createLimit
        }))
            .then((response) => {
                props.history.push('room/' + response.data.data);
                console.log(response)
            })
            .catch((error) => {
                console.log("error");
            })
    };

    const errorModal = (mesg: string) => {
        setWrongMesg(mesg);
        setCreateWrong(true);
    }




    return (
        <div className='Lobby_draw' style={{ flexDirection: 'row' }}>



            <SideBar />

            <div className='Lobby_room' >

                <div className='Lobby_top'>
                    <div className='Lobby_text'> Lobby </div>
                    <div className='Lobby_create'>
                        <Button onClick={() => refreshClick()}>{refreshIcon()}</Button>
                        <Button variant="contained" color="primary" onClick={() => createClick()}>  Create! </Button>

                        <Modal
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
                                    <h2>Wrong!</h2>
                                    <p>{wrongMesg}</p>
                                </div>
                            </Fade>
                        </Modal>

                        <Modal
                            open={createModel}
                            onClose={() => { setCreateModel(false) }}
                            closeAfterTransition
                            className={classes.modal}
                            BackdropComponent={Backdrop}
                            BackdropProps={{
                                timeout: 500,
                            }}
                        >
                            <Fade in={createModel}>
                                <div className={classes.creatpad}>
                                    <h2 >공부방 만들기!</h2>
                                    <div>
                                        <TextField
                                            fullWidth={true}
                                            onChange={e => { setCreateRoomTitle(e.target.value); }}
                                            label="공부방 이름"
                                        />
                                        <Select
                                            value={createLimit}
                                            onChange={(event: any) => { setCreateLimit(event.target.value) }}
                                        >
                                            <MenuItem value={1}>1</MenuItem>
                                            <MenuItem value={2}>2</MenuItem>
                                            <MenuItem value={3}>3</MenuItem>
                                            <MenuItem value={4}>4</MenuItem>
                                            <MenuItem value={5}>5</MenuItem>
                                            <MenuItem value={6}>6</MenuItem>
                                            <MenuItem value={7}>7</MenuItem>
                                            <MenuItem value={8}>8</MenuItem>
                                        </Select>
                                    </div>
                                    <Button variant="contained" color="primary" onClick={() => confirmClick()}>Confirm </Button>
                                </div>
                            </Fade>
                        </Modal>
                    </div>
                </div>



                <Divider variant='middle' />

                <Grid container alignItems="stretch" >

                    {rooms.map((room, i) => <RoomBox
                        name={room.name}
                        currentMembers={room.currentMembers}
                        limitMembers={room.limitMembers}
                        history={props.history}
                        setCreateWrong={setCreateWrong}
                        errorModal={errorModal}
                        key={i} />)}

                </Grid>


            </div>



        </div>
    );


}

export default Lobby;