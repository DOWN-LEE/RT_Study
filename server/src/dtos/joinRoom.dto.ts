import { IsEmail, IsString } from 'class-validator';

export class JoinRoomDto {
  @IsEmail()
  public email: string;

  @IsString()
  public roomName: string;

}

