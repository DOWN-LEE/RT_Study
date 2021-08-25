import React from 'react';
import {Route, Switch} from 'react-router-dom';
import Room from './Pages/Room/Room';
import Room1 from './Pages/Room/Room1';
import Lobby from './Pages/Lobby/Lobby';
import './App.css';

function App() {
  return (
    <div>
      <Switch>
        <Route path="/" exact component={Lobby} />
        <Route path="/room/:roomId" exact component={Room1}/>
        <Route path="/room1/:roomId" exact component={Room}/>
        <Route render={() => <h1>Not Found</h1>} />
      </Switch>
    </div>
   
  );
}

export default App;
