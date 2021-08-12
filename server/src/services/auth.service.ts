import bcrypt from 'bcrypt';
import { CreateUserDto } from '../dtos/users.dto';
import { User } from '../interfaces/users.interface';
import { HttpException } from '../exceptions/HttpException';
import userModel from '../models/users.model';

class AuthService {

    public users = userModel;

    public async signup(userData: CreateUserDto): Promise<User> {
        const findUser: User = await this.users.findOne({ email: userData.email });
        if(findUser) throw new HttpException(409, `You're email ${userData.email} already exists`);

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const createUserData: User = await this.users.create({...userData, password: hashedPassword});
        
        return createUserData;
    }
};

export default AuthService;