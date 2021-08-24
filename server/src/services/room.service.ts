import { JoinRoomDto } from 'dtos/joinRoom.dto';
import { RedisClient } from 'redis';
import { RedisRoomDto } from '../dtos/room.dto';
import { Server } from 'socket.io';

class RoomService {


    public async join(joinData: JoinRoomDto, redisClient: RedisClient, io: Server): Promise<boolean> {

        try {
            const roomName = joinData.roomName;
            const userEmail = joinData.email;
            let room: RedisRoomDto;

            redisClient.hget('Rooms', roomName, (err, obj) => {
                if(obj) {
                    room = JSON.parse(obj);
                }
            });

            if (!room || room.limitMembers <= room.currentMembers) {
                return false;
            }

            redisClient.hget('Users', userEmail, (err, obj) => {
                if(obj) {
                    io.to(obj).emit('newConnection');
                }
            });

            room.currentMembers += 1;

            return true;
        } catch (error) {
            return false;
        }

    }





};

export default RoomService;