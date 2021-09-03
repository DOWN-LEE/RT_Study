import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import validationMiddleware from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';
import { CreateUserDto } from '../dtos/users.dto';
import { LoginUserDto } from '../dtos/loginUsers.dto';

import AuthController from '../controllers/auth.controller';

class AuthRoute implements Routes {
    public path = '/api/auth/';
    public router = Router();
    public authController = new AuthController();


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}signup`, validationMiddleware(CreateUserDto, 'body'), this.authController.signup);
        this.router.post(`${this.path}login`, validationMiddleware(LoginUserDto, 'body'), this.authController.login);
        this.router.post(`${this.path}logout`, authMiddleware, this.authController.logout);
        this.router.get(`${this.path}auth`, authMiddleware, this.authController.auth)
    }
    
}

export default AuthRoute;