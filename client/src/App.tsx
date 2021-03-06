import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Room1 from './Pages/Room/Room1';
import Lobby from './Pages/Lobby/Lobby';
import './App.css';

import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';


function App() {
  return (
    
     
        <Switch>
          <Route path="/" exact component={Lobby} />
          <Route path="/room/:roomId" exact component={Room1} />
          <Route render={() => <h1>Not Found</h1>} />
        </Switch>
     
   

  );
}

export default App;
