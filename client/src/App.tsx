import React from 'react';
import {Route, Switch} from 'react-router-dom';
import Room from './Pages/Room';
import './App.css';

function App() {
  return (
    <div>
      <Switch>
        <Route path="/room/:roomname" exact component={Room}/>
        <Route render={() => <h1>Not Found</h1>} />
      </Switch>
    </div>
   
  );
}

export default App;
