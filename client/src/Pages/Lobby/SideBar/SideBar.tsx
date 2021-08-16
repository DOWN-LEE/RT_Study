import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, withStyles, makeStyles, createStyles,  Modal, Backdrop, Fade, Theme } from '@material-ui/core';
import { api } from '../../../api/axios';
import qs from 'qs';

import './SideBar.css';

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
    paper: {
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
  }),
);


const SideBar = () => {


    const [userId, setUserId] = useState<String>('');
    const [password, setPassword] = useState<String>('');
    const [validId, setValidId] = useState<boolean>(false);
    const [validPassword, setValidPassword] = useState<boolean>(false);
    const [invalidId, setInvalidId] = useState<boolean>(false);

    const classes = useStyles();

    const loginClick = async() => {
        if(userId == '' || password == '') {
            if(userId=='') setValidId(true);
            if(password=='') setValidPassword(true);
            return;
        }

        await api
            .post('/login/', qs.stringify({ email: userId, password: password }))
            .then((response) => {
                console.log("!!", response);
            })
            .catch((error) => {
                setValidId(true);
                setValidPassword(true);
                setInvalidId(true);
            });

    }


    return (

        <div className="sidebar">
            <div className="logoText">
                RT_STUDY
            </div>
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
                onChange={e =>{setValidId(false); setUserId(e.target.value);}}

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
                onChange={e =>{setValidPassword(false); setPassword(e.target.value);}}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                id="loginButton"
                onClick={()=>loginClick()}
            >
                Log in
            </Button>

            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={invalidId}
                onClose={()=>{setInvalidId(false)}}
                closeAfterTransition
                className={classes.modal}
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={invalidId}>
                    <div className={classes.paper}>
                        <h2 id="transition-modal-title">Wrong!</h2>
                        <p id="transition-modal-description">아이디와 비밀번호를 다시 확인해주세요.</p>
                    </div>
                </Fade>
            </Modal>

        </div>

    );


}

export default SideBar;