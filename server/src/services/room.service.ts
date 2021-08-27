import { JoinRoomDto } from 'dtos/joinRoom.dto';
import { CreateRoomDto } from 'dtos/createRoom.dto';
import { RedisClient } from 'redis';
import { RedisRoomDto } from '../dtos/room.dto';
import { Server } from 'socket.io';
import { Request } from 'express';
import crypto from 'crypto'
import { Room, setupRoom } from '../socket/new/room/room';

class RoomService {


    public async join(joinData: JoinRoomDto) {
        try {
         
            
            const roomName = joinData.roomName;
            
            for(const key in Room.rooms) {
                if(roomName == Room.rooms.get(key).name){
                    const room = Room.rooms.get(key);
                    if(room.limitMembers <= room.Members.size){
                        return { type: 'exceed' };
                    }
                    return {type : 'OK', url : room.url };
                }
            }

            
            return { type: 'error' };
            
        } catch (error) {
            return { type: 'error' };
        }
    }

    public async create(createData: CreateRoomDto){
        try {
            // 중복검사
            for(const key in Room.rooms) {
                if(createData.roomName == Room.rooms.get(key).name){
                    return { type: 'duplicate' };
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
            return { type: 'error' };
        }
    }

    public list() {

        const result = [];
        for(const key in Room.rooms) {
            const room = Room.rooms.get(key);
            result.push({
                name: room.name,
                limitMembers: room.limitMembers,
                currentMembers: room.Members.size,

            })
        }

        return result;

    }





};

export default RoomService;