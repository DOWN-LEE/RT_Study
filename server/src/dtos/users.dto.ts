import { IsEmail, isString, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  public password: string;

  @Length(3, 10)
  public name: string;
}

