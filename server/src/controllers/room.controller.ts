import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '../dtos/users.dto';
import { JoinRoomDto } from '../dtos/joinRoom.dto';
import { User } from '../interfaces/users.interface';
import AuthService from '../services/auth.service';
import RoomService from 'services/room.service';
import { RequestWithUser } from 'interfaces/auth.interface';

class RoomController {
    public authService = new AuthService();
    public roomService = new RoomService();

    public signup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: CreateUserDto = req.body;
            const signUpUserData: User = await this.authService.signup(userData);
            
            res.status(201).json({ data: signUpUserData, message: 'signup'});
        } catch (error) {
            next(error);
        }
    };

    public join = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const joinData: JoinRoomDto = req.body;
            const joinResult: boolean = await this.roomService.join(joinData, req.app.get("redisClient"));

            if(joinData) {
                res.sendStatus(200);
            }

            

        } catch (error) {
            next(error);
        }
    };

}

export default RoomController;