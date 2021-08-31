process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { Routes } from './interfaces/routes.interface';
import { connect, set } from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import redis from 'redis';
import { SFUstart } from './socket/SFU';
import { SFUstart as sf } from './socket/SFUserver';

import config from 'config';


class App{
    public app: express.Application;
    public port: string | number;

    constructor(routes: Routes[]) {
        this.app = express();
        this.port = 3001;
        
        this.connectToDatabase();
        this.initializeMiddlewares();
        this.initializeRoutes(routes);
        this.initializeErrorHandling();
        SFUstart(this.app);
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log('listen start')
        });
    }

    private connectToDatabase() {
        const { host, database, port }: any = config.get('dbConfig');
        const url = `mongodb://${host}:${port}/${database}`;
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        };

        connect(url, options);

        const { rhost, rport, rdb }: any = config.get('redisConfig');
        const redisClient = redis.createClient({
            host : rhost,
            port : rport,
            db : rdb    
           // password:
        });

        this.app.set("redisClient", redisClient);

    }

    private initializeMiddlewares() {
        this.app.use(express.urlencoded({ extended:false }));
        this.app.use(cookieParser());
        this.app.use(cors({ origin: true,  
            credentials: true, // 크로스 도메인 허용
         }));
        
        // this.app.use(function (req, res, next) {
        //     // Website you wish to allow to connect
        //     res.setHeader('Access-Control-Allow-Origin', '*');
        //     // Request methods you wish to allow
        //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        //     // Request headers you wish to allow
        //     res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,set-cookie');
        //     // Set to true if you need the website to include cookies in the requests sent
        //     // to the API (e.g. in case you use sessions)
        //     res.setHeader('Access-Control-Allow-Credentials', 'true');
         
        //     // Pass to next layer of middleware
        //     next();
        //   });
    }

    private initializeRoutes(routes: Routes[]) {
        routes.forEach(route => {
            this.app.use('/', route.router);
        });

        this.app.get('/hi', (req: Request, res: Response, next: NextFunction)=>{
            console.log('hi~~~');
            res.status(201).json({hi:"hi!"});
        })
    }

    private initializeErrorHandling() {
        //this.app.use(errorMiddleware);
    }

    

}

export default App;