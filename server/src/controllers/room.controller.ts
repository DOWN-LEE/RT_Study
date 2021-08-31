import { NextFunction, Request, Response } from 'express';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { JoinRoomDto } from '../dtos/joinRoom.dto';
import { User } from '../interfaces/users.interface';

import RoomService from '../services/room.service';
import { RedisClient } from 'redis';
import { RequestWithUser } from 'interfaces/auth.interface';

class RoomController {
  
    public roomService = new RoomService();


    public join = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const joinData: JoinRoomDto = req.body;
            //const redisClient: RedisClient = req.app.get('redisClient');
            const joinResult= await this.roomService.join(joinData);

            
            
            res.status(200).json({ data: joinResult.url, message: 'url'});
            
            

        } catch (error) {
            next(error);
        }
    };

    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const createData: CreateRoomDto = req.body;
            //const redisClient: RedisClient = req.app.get('redisClient');

            const createResult = await this.roomService.create(createData);

    
           
            res.status(200).json({ data: createResult.url, message: 'url' });
            

        } catch (error) {
            next(error);
        }
    };

    public list = (req: Request, res: Response, next: NextFunction) => {
        try {
            const getlist = this.roomService.list();
            res.status(200).json({ data: getlist, message: 'list'});

        } catch (error) {
            next(error);
        }
    }

}

export default RoomController;