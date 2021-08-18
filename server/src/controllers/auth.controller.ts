import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '../dtos/users.dto';
import { LoginUserDto } from '../dtos/loginUsers.dto';
import { User } from '../interfaces/users.interface';
import AuthService from '../services/auth.service';
import { RequestWithUser } from 'interfaces/auth.interface';

class AuthController {
    public authService = new AuthService();

    public signup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: CreateUserDto = req.body;
            const signUpUserData: User = await this.authService.signup(userData);
            
            res.status(201).json({ data: signUpUserData, message: 'signup'});
        } catch (error) {
            next(error);
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: LoginUserDto = req.body;
            const { cookie, findUser } = await this.authService.login(userData);
            
            res.setHeader('Set-Cookie', [cookie]);          
            res.status(200).json({ data: findUser, message: 'login' });
        } catch (error) {
            next(error);
        }
    };

    public logout = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const userData: User = req.user;
            const logOutUserData: User = await this.authService.logout(userData);
            
            res.setHeader('Set-Cookie', ['Authorization=; Max-age=0; Path=/;']);
            res.status(200).json({ data: logOutUserData, message: 'logout' });
        } catch (error) {
            next(error);
        }
    };

    public auth = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const userData: User = req.user;
            res.status(200).json({ data: userData, message: 'auth' });
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;