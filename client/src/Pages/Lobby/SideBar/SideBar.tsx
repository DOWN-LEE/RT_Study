import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, makeStyles, withStyles } from '@material-ui/core';

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

const SideBar = () => {


    const [userId, setUserId] = useState<String>('');
    const [password, setPassword] = useState<String>('');




    return (

        <div className="sidebar">
            <div className="logoText">
                RT_STUDY
            </div>
            <CssTextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="userid"
                name="userid"
                label="ID"
                InputProps={{ className: "textInput" }}
                onChange={e => setUserId(e.target.value)}

            />
            <CssTextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                InputProps={{ className: "textInput" }}
                onChange={e => setPassword(e.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                id="loginButton"
            >
                Log in
            </Button>

        </div>

    );


}

export default SideBar;