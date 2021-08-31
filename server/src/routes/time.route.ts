import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';

import TimeController from '../controllers/time.controller';


class TimeRoute implements Routes {
    public path = '/time/';
    public router = Router();
    public timeController = new TimeController();


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}get`, this.timeController.get);
        this.router.post(`${this.path}update`, this.timeController.update);
        this.router.get(`${this.path}rank`, this.timeController.rank);
    }
    
}

export default TimeRoute;