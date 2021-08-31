import { RedisClient } from 'redis';
import { getTimeDto, updateTimeDto } from '../dtos/time.dto';
import { Server } from 'socket.io';
import { Request } from 'express';
import { HttpException } from '../exceptions/HttpException';
import crypto from 'crypto'
import { Room, setupRoom } from '../socket/room/room';
import { promisify } from 'util'

class TimeService {


    public async get(getTimeData: getTimeDto, redisClient: RedisClient) {
        try {

            const name = getTimeData.name;

            const getAsync = promisify(redisClient.hget).bind(redisClient);

            const time = await getAsync('studyTime', name);

            if (time) {
                return { type: 'OK', time: time };
            }

            return { type: 'OK', time: "0" };

        } catch (error) {
            return { type: 'OK', time: "0" };
        }
    }

    public async update(updateTimeDto: updateTimeDto, redisClient: RedisClient) {
        try {

            const name = updateTimeDto.name;
            const time = updateTimeDto.time;

            redisClient.hset('studyTime', name, time);



            return { type: 'OK' };

        } catch (error) {
            throw new HttpException(404, 'error');
        }
    }


    public async rank(redisClient: RedisClient) {
        try {
            const getAsync = promisify(redisClient.hgetall).bind(redisClient);
            const rank = await getAsync('studyTime');

            var sortable = [];
            for (var name in rank) {
                sortable.push([name, rank[name]]);
            }

            sortable.sort(function (a, b) {
                return b[1] - a[1];
            });

            return { type: 'OK', rank: sortable.slice(0,10)};


        } catch (error) {
            throw new HttpException(404, 'error');
        }
    }




};

export default TimeService;