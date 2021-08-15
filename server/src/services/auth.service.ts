import bcrypt from 'bcrypt';
import { CreateUserDto } from '../dtos/users.dto';
import { LoginUserDto } from '../dtos/loginUsers.dto';
import { User } from '../interfaces/users.interface';
import { DataStoredInToken, TokenData } from '../interfaces/auth.interface';
import { HttpException } from '../exceptions/HttpException';
import userModel from '../models/users.model';
import jwt from 'jsonwebtoken';
import config from 'config';

class AuthService {

    public users = userModel;

    public async signup(userData: CreateUserDto): Promise<User> {
        const findUser: User = await this.users.findOne({ email: userData.email });
        if(findUser) throw new HttpException(409, `You're email ${userData.email} already exists`);

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const createUserData: User = await this.users.create({...userData, password: hashedPassword});

        return createUserData;
    }

    public async login(userData: LoginUserDto): Promise<{ cookie: string; findUser: User }> {
        const findUser: User = await this.users.findOne({ email: userData.email });
        if(!findUser) throw new HttpException(409, `You're email ${userData.email} not found`);

        const isPasswordMatching: boolean = await bcrypt.compare(userData.password, findUser.password);
        if(!isPasswordMatching) throw new HttpException(409, 'Wrong password');

        const tokenData = this.createToken(findUser);
        const cookie = this.createCookie(tokenData);

        return { cookie, findUser };
    }

    public async logout(userData: User): Promise<User> {
        const findUser: User = await this.users.findOne({ email: userData.email })
        if(!findUser) throw new HttpException(409, `You're email ${userData.email} not found`);

        return findUser;
    }

    public createToken(user: User): TokenData {
        const dataStoredInToken: DataStoredInToken = { _id: user._id };
        const secretKey: string = config.get('secretKey');
        const expiresIn: number = 60 * 60;

        return { expiresIn, token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }) };
    }

    public createCookie(tokenData: TokenData): string {
        return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
    }
};

export default AuthService;