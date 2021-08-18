import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import authentication from './authentication/authentication';



const rootReducer = combineReducers({
    authentication
});


const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;