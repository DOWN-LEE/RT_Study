import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import validationMiddleware from '../middlewares/validation.middleware';
import { CreateUserDto } from '../dtos/users.dto';

import AuthController from '../controllers/auth.controller';

class AuthRoute implements Routes {
    public path = '/';
    public router = Router();
    public authController = new AuthController();


    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}signup`, validationMiddleware(CreateUserDto, 'body'), this.authController.signup);
        this.router.post(`${this.path}login`, );
        this.router.post(`${this.path}logout`, );
    }
    
}

export default AuthRoute;