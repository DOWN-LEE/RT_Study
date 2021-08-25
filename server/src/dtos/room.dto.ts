export class RedisRoomDto {
  
    public roomName: string;
    public roomUrl: string;
    public hostEmail: string;
    public currentMembers: number;
    public limitMembers: number;
    public Members: {[key: string]: string}; // 닉네임 : 소켓id
    public date: string;
    
    
}


// key : roomid (roomurl)