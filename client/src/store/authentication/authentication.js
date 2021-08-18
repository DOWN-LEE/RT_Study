import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/axios';

const slice = createSlice({
  name: 'authentication',
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

// export const trySignup = (user) => async (dispatch) => {
//   try {
//     await api.post('/users/signup/', user).then(async (response) => {
//       // await api.post('/users/signin/', user).then((response) => {
//       dispatch(login(response.data));
//       // sessionStorage.setItem('userInfo', JSON.stringify(response.data));
//       // });
//     });
//   } catch (e) {
//     return console.error(e.message);
//   }
// };

// export const trySignout = (user) => async (dispatch) => {
//   try {
//     await api.post('/users/signout/', user).then((response) => {
//       dispatch(logout());
//       // sessionStorage.removeItem('userInfo');w
//     });
//   } catch (e) {
//     return console.error(e.message);
//   }
// };

// export const updateUserInfo = (userChange) => async (dispatch) => {
//   try {
//     await api.put('/users/userInfo/', userChange).then((response) => {
//       dispatch(login(response.data));
//       // sessionStorage.setItem('userInfo', JSON.stringify(response.data));
//     });
//   } catch (e) {
//     return console.error(e.message);
//   }
// };
