import express from 'express';

import { startWorkers } from './worker/worker';
import { run } from './server';


export async function SFUstart(app: express.Application){

    await startWorkers();
    run(app);

}