import { createWorker, types as mediaSoupTypes } from 'mediasoup';
import config from 'config';
import { getRooms } from '../request/requests';


const workers: Array<mediaSoupTypes.Worker> = [];
let nextWorkerIndex = 0;

export async function startWorkers() {

    try {
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
    }
    catch (error) {
        console.error('worker start error ! \n', error);
        process.exit(1);
    }

};


export function getNextWorker() {


    // 라운드 로빈

    // const worker = workers[nextWorkerIndex];
    // if (++nextWorkerIndex == workers.length) {
    //     nextWorkerIndex = 0;
    // }

    // return worker;


    // 최소 선택
    let numWorker = new Array(workers.length).fill(0);
    const rooms = getRooms();
    rooms.forEach(room => {
        numWorker[room.workerNum]++;
    });

    nextWorkerIndex = 0;
    let minVal = numWorker[0];
    for(let i=1; i < numWorker.length; i++){
        if(minVal > numWorker[i]){
            minVal = numWorker[i];
            nextWorkerIndex = i;
        }
    }

    return {worker: workers[nextWorkerIndex], index: nextWorkerIndex};
};


export function releaseWorkers() {
    for (const worker of workers) {
        worker.close();
    }

    workers.length = 0;
};


