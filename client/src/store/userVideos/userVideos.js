import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/axios';




const slice = createSlice({
  name: 'userVideos',
  initialState: {
    loggingIn: undefined,
    user: null,
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.loggingIn = true;
    },
    logout: (state, action) => {
      state.user = null;
      state.loggingIn = false;
    },
  },
});

export default slice.reducer;

// Actions

export const { login, logout } = slice.actions;

export const checkLogin = () => async (dispatch) => {
  await api.get('/auth/auth/')
    .then((response) => {
      dispatch(login(response.data.data));
    })
    .catch((error) => {
      dispatch(logout());
    });
};

export const tryLogin = (user) => async (dispatch) => {
  dispatch(login(user));
};

export const tryLogout = () => async (dispatch) => {
  await api.post('/auth/logout/')
    .then((response) => {
      dispatch(logout())
    })
    .catch((error) => {
    })
};
