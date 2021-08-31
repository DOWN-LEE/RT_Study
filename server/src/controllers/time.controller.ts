import { NextFunction, Request, Response } from 'express';

import { getTimeDto, updateTimeDto } from '../dtos/time.dto';
import TimeService from '../services/time.service';
import { RedisClient } from 'redis';
import { RequestWithUser } from 'interfaces/auth.interface';

class TimeController {
    
    public timeService = new TimeService();

    public get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const getTimeData: getTimeDto = req.body;
            const redisClient: RedisClient = req.app.get('redisClient');
            const time= await this.timeService.get(getTimeData, redisClient);
     
            res.status(200).json({ data: time, message: 'time'});

        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updateTimeDto: updateTimeDto = req.body;
            const redisClient: RedisClient = req.app.get('redisClient');

            await this.timeService.update(updateTimeDto, redisClient);

            
            res.status(200).json({ message: 'update' });
            

        } catch (error) {
            next(error);
        }
    };

    public rank = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const redisClient: RedisClient = req.app.get('redisClient');

            const rank = await this.timeService.rank(redisClient);

            res.status(200).json({ data: rank, message: 'rank'});

        } catch (error) {
            next(error);
        }
    }

}

export default TimeController;