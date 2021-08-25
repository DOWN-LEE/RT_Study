import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';

import RoomController from '../controllers/room.controller';


class RoomRoute implements Routes {
    public path = '/room/';
    public router = Router();
    public roomController = new RoomController();


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}join`, this.roomController.join);
        this.router.post(`${this.path}create`, this.roomController.create);
    }
    
}

export default RoomRoute;