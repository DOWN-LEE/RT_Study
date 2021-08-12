import express from 'express';
import { Routes } from './interfaces/routes.interface';
import { connect, set } from 'mongoose';
import bodyParser from 'body-parser';


class App{
    public app: express.Application;
    public port: string | number;

    constructor(routes: Routes[]) {
        this.app = express();
        this.port = 3000;
        
        this.connectToDatabase();
        this.initializeMiddlewares();
        this.initializeRoutes(routes);
        this.initializeErrorHandling();
       
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log('listen start')
        });
    }

    private connectToDatabase() {
        const host = 'localhost';
        const port = 27017;
        const database = 'mydb';
        const url = `mongodb://${host}:${port}/${database}`;
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        };

        connect(url, options);
    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.urlencoded({extended:false}));
    }

    private initializeRoutes(routes: Routes[]) {
        routes.forEach(route => {
            this.app.use('/', route.router);
        });
    }

    private initializeErrorHandling() {
        //this.app.use(errorMiddleware);
    }


}

export default App;