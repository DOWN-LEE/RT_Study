import { JoinRoomDto } from 'dtos/joinRoom.dto';
import { CreateRoomDto } from 'dtos/createRoom.dto';
import { RedisClient } from 'redis';
import { RedisRoomDto } from '../dtos/room.dto';
import { Server } from 'socket.io';
import { Request } from 'express';
import { HttpException } from '../exceptions/HttpException';
import crypto from 'crypto'
import { Room, setupRoom } from '../socket/room/room';

class RoomService {


    public async join(joinData: JoinRoomDto) {
        try {
         
            
            const roomName = joinData.roomName;
            
            for(const room of Room.rooms.values()) {
                if(roomName == room.name){
                    if(room.limitMembers <= Object.keys(room.Members).length){
                        throw new HttpException(403, 'exceed!');
                    }
                    return {type : 'OK', url : room.url };
                }
            }

            
            throw new HttpException(404, 'error');
            
        } catch (error) {
            throw new HttpException(404, 'error');
        }
    }

    public async create(createData: CreateRoomDto){
        try {
            // 중복검사
            for(const room of Room.rooms.values()) {
                if(createData.roomName == room.name){
                    throw new HttpException(403, 'duplicate!');
                }
            }

            const roomName = createData.roomName;
            const hostEmail = createData.hostEmail;
            const limitMembers = createData.limitMembers;
            
            const today = new Date();
            const hours = ('0' + today.getHours()).slice(-2);
            const minutes = ('0' + today.getMinutes()).slice(-2);
            const seconds = ('0' + today.getSeconds()).slice(-2);
            const timeString = hours + ':' + minutes + ':' + seconds;
            const date = timeString;
  
            const roomUrl = crypto.createHash('md5').update(date + roomName).digest("hex");

            setupRoom(roomName, roomUrl, hostEmail, limitMembers);


            return { type: 'OK', url: roomUrl};
            
           
        } catch (error) {
            throw new HttpException(404, 'error!');
        }
    }

    public list() {
        
        const result = [];
        for(const room of Room.rooms.values()) {
            result.push({
                name: room.name,
                limitMembers: room.limitMembers,
                currentMembers: Object.keys(room.Members).length,

            })
        }

        return result;

    }





};

export default RoomService;