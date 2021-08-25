import { JoinRoomDto } from 'dtos/joinRoom.dto';
import { CreateRoomDto } from 'dtos/createRoom.dto';
import { RedisClient } from 'redis';
import { RedisRoomDto } from '../dtos/room.dto';
import { Server } from 'socket.io';
import { Request } from 'express';
import crypto from 'crypto'

class RoomService {


    public async join(joinData: JoinRoomDto, redisClient: RedisClient): Promise<string> {
        try {
         
            
            const roomName = joinData.roomName;
            
            let room: RedisRoomDto;

            redisClient.hget('Rooms', roomName, (err, obj) => {
                if(obj) {
                    room = JSON.parse(obj);
                }
            });

            if (!room || room.limitMembers <= room.currentMembers) {
                return 'exceed';
            }

            return room.roomUrl;
        } catch (error) {
            return 'error';
        }
    }

    public async create(createData: CreateRoomDto, redisClient: RedisClient){
        try {
            // 중복검사
            redisClient.hgetall('Rooms', (err, obj) => {
                for(const key in obj) {
                    const value = JSON.parse(obj[key]);
                    if(value.roomName == createData.roomName){
                        return { type: 'duplicate' };
                    }
                }
            });

            let newRoom: RedisRoomDto;
            newRoom.roomName = createData.roomName;
            newRoom.limitMembers = createData.limitMembers;
            newRoom.hostEmail = createData.hostEmail;
            newRoom.currentMembers = 0;
            newRoom.Members = {};

            const today = new Date();
            const hours = ('0' + today.getHours()).slice(-2);
            const minutes = ('0' + today.getMinutes()).slice(-2);
            const seconds = ('0' + today.getSeconds()).slice(-2);
            const timeString = hours + ':' + minutes + ':' + seconds;
            newRoom.date = timeString;

            newRoom.roomUrl = crypto.createHash('md5').update(newRoom.date + newRoom.roomName).digest("hex");

            redisClient.hset('Rooms', newRoom.roomUrl, JSON.stringify(newRoom));

            return { type: 'OK', url: newRoom.roomUrl};
            
           
        } catch (error) {
            return { type: 'error' };
        }
    }





};

export default RoomService;