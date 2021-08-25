import { NextFunction, Request, Response } from 'express';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { JoinRoomDto } from '../dtos/joinRoom.dto';
import { User } from '../interfaces/users.interface';
import AuthService from '../services/auth.service';
import RoomService from 'services/room.service';
import { RedisClient } from 'redis';
import { RequestWithUser } from 'interfaces/auth.interface';

class RoomController {
    public authService = new AuthService();
    public roomService = new RoomService();


    public join = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const joinData: JoinRoomDto = req.body;
            const redisClient: RedisClient = req.app.get('redisClient');
            const joinResult: string = await this.roomService.join(joinData, redisClient);

            if(joinResult == 'exceed') {
                res.sendStatus(403);
            }
            else if(joinResult == 'error') {
                res.sendStatus(404);
            }
            else {
                res.status(200).json({ url: joinResult });
            }
            

        } catch (error) {
            next(error);
        }
    };

    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const createData: CreateRoomDto = req.body;
            const redisClient: RedisClient = req.app.get('redisClient');

            const createResult = await this.roomService.create(createData, redisClient);

            if(createResult.type == 'error') {
                res.sendStatus(404);
            }
            else if(createResult.type == 'duplicate') {
                res.sendStatus(403);
            }
            else if(createResult.type == 'OK'){
                res.status(200).json({ url: createResult.url });
            }

        } catch (error) {
            next(error);
        }
    };

}

export default RoomController;