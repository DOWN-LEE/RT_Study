import express from 'express';

import { startWorkers } from './worker/worker';
import { run } from './server';


export  function SFUstart(app: express.Application){

    startWorkers();
    run(app);

}