import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, withStyles, makeStyles, createStyles,  Modal, Backdrop, Fade, Theme, Paper, Grid, Typography,
TableContainer, Table, TableHead ,TableCell, TableRow, TableBody } from '@material-ui/core';
import { api } from '../../../api/axios';
import qs from 'qs';
import { rankUser } from  './@type/index';

import { useDispatch, useSelector } from 'react-redux';


import './SideBar.css';
import { checkLogin, tryLogout, tryLogin } from '../../../store/authentication/authentication';

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
      paper: {
          padding: theme.spacing(2),
          margin: 'auto',
          maxWidth: 500,
      },
      table: {
        minWidth: 20,
      },
  }),
);



const SideBar = () => {


    const [userId, setUserId] = useState<String>('');
    const [password, setPassword] = useState<String>('');
    const [validId, setValidId] = useState<boolean>(false);
    const [validPassword, setValidPassword] = useState<boolean>(false);
    const [invalidId, setInvalidId] = useState<boolean>(false);
    const [rank, setRank] = useState<rankUser[]>([]);
    

    const { loggingIn, user } = useSelector((state: any) => state.authentication)

    const classes = useStyles();
    const dispatch = useDispatch();

    useEffect(() => {  
        if(loggingIn == undefined)
            dispatch(checkLogin());
        
        api.get('/time/rank/')
            .then((response) => {
                const result = response.data.data.rank;
                let newRank = [];
                for (const r of result) {
                    newRank.push({
                        name: r[0],
                        time: r[1]
                    })
                };
                setRank(newRank);
            });
    }, []);

    useEffect(() => {
        const updateRank = setInterval(() => {
            api.get('/time/rank/')
                .then((response) => {
                    const result = response.data.data.rank;
                    let newRank = [];
                    for(const r of result){
                        newRank.push({
                            name: r[0],
                            time: r[1]
                        })
                    };
                    setRank(newRank);
                });
        }, 2000);

        return () => {
            clearInterval(updateRank);
        }
    },[]);

   

    const loginClick = async() => {
        if(userId == '' || password == '') {
            if(userId=='') setValidId(true);
            if(password=='') setValidPassword(true);
            return;
        }

        await api.post('/auth/login/', qs.stringify({ email: userId, password: password }))
            .then((response) => {
                dispatch(tryLogin(response.data.data));
            })
            .catch((error) => {
                setValidId(true);
                setValidPassword(true);
                setInvalidId(true);
            });
    }

    const logoutClick = () => {
        if(loggingIn==true)
            dispatch(tryLogout());
    }

    const userInfo = () => {
        if(loggingIn == undefined){
            return;
        }
        else if(loggingIn == false){
            return(
                <div>
                    <CssTextField
                        error={validId}
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="userid"
                        name="userid"
                        label="Email"
                        InputProps={{ className: "textInput" }}
                        onChange={e => { setValidId(false); setUserId(e.target.value); }}

                    />
                    <CssTextField
                        error={validPassword}
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        name="password"
                        label="Password"
                        type="password"
                        InputProps={{ className: "textInput" }}
                        onChange={e => { setValidPassword(false); setPassword(e.target.value); }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        id="loginButton"
                        onClick={() => loginClick()}
                    >
                        Log in
                    </Button>


                    <Modal
                        aria-labelledby="transition-modal-title"
                        aria-describedby="transition-modal-description"
                        open={invalidId}
                        onClose={() => { setInvalidId(false) }}
                        closeAfterTransition
                        className={classes.modal}
                        BackdropComponent={Backdrop}
                        BackdropProps={{
                            timeout: 500,
                        }}
                    >
                        <Fade in={invalidId}>
                            <div className={classes.pad}>
                                <h2 id="transition-modal-title">Wrong!</h2>
                                <p id="transition-modal-description">아이디와 비밀번호를 다시 확인해주세요.</p>
                            </div>
                        </Fade>
                    </Modal>
                </div>
            )
        }
        else if(loggingIn == true){
            return(
                <div>
                    <Paper className={classes.paper}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm container>
                                <Grid item xs container direction="column" spacing={2}>
                                    <Grid item xs>
                                        <Typography gutterBottom variant="subtitle1">
                                            {user.name}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary">
                                            {user.email}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    <Button variant="outlined" size="small" onClick={()=>{logoutClick()}}> logout </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>
                </div>
            )
        }
    }


    const formatTime = (itime: string) => {
        const time = Number(itime);
        const getSeconds: any = `0${(time % 60)}`.slice(-2)
        const minutes: any = `${Math.floor(time / 60)}`
        const getMinutes = `0${minutes % 60}`.slice(-2)
        const getHours = `0${Math.floor(time / 3600)}`.slice(-2)
    
        return `${getHours} : ${getMinutes} : ${getSeconds}`
    }


    return (

        <div className="sidebar">
            <div className="logoText">
                RT_STUDY
            </div>

            {userInfo()}

            <div className='rankBox'>
                오늘의 공부순위
                <TableContainer component={Paper}>
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                {/* <TableCell>Rank</TableCell> */}
                                <TableCell align="left">Name</TableCell>
                                <TableCell align="center">RT_Time</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rank.map((r, index) => (
                                <TableRow key={index}>
                                    {/* <TableCell component="th" scope="row">
                                        {index+1}
                                    </TableCell> */}
                                    <TableCell align="left">{r.name}</TableCell>
                                    <TableCell align="center">{formatTime(r.time)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>


        </div>

    );


}

export default SideBar;