import { createWorker, types as mediaSoupTypes } from 'mediasoup';
import config from 'config';

const workers = [];
let nextWorkerIndex = 0;

export async function startWorkers() {

    const numWorkers = config.get('MediaWorkers');

    if (workers.length > 0) {
        throw new Error('[startWorkers] Workers already exist!')
    }

    for (let i = 0; i < numWorkers; i++) {
        const worker = await createWorker({
            rtcMaxPort: 10300,
            rtcMinPort: 10000,
        });

        worker.once('died', () => {
            console.error('worker::died [pide:%d] exiting in 2 seconds...', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        });

        workers.push(worker);
    };

};


export function getNextWorker() {

    const worker = workers[nextWorkerIndex];
    if (++nextWorkerIndex == workers.length) {
        nextWorkerIndex = 0;
    }

    return worker;
};


export function releaseWorkers() {
    for (const worker of workers) {
        worker.close();
    }

    workers.length = 0;
};


